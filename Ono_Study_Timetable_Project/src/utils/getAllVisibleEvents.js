import { getRecords } from './storage'; // Keep temporarily if getLecturersMap isn't updated yet
import { formatDateTime, getExclusiveEndDate } from './eventFormatters';
import { fetchCollection, fetchDocumentsByQuery } from '../firebase/firestoreService'; // Import Firestore functions

// --- Helper Functions & Constants ---

// Cache for lecturers map (remains the same logic, but data source changes)
let lecturersMapCache = null;
const getLecturersMap = async () => {
    // Return cache if available
    if (lecturersMapCache) return lecturersMapCache;
    console.log("[getAllVisibleEvents:getLecturersMap] Creating lecturers map from Firestore...");
    try {
        // ✅ Fetch lecturers from Firestore
        const lecturers = await fetchCollection("lecturers");
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("[getAllVisibleEvents:getLecturersMap] Error fetching lecturers:", error);
         lecturersMapCache = new Map(); // Return empty map on error
         return lecturersMapCache;
    }
};

// Color definitions (ideally move to a central config/theme file)
const EVENT_COLORS = { courseMeeting: '#42a5f5', event: '#ab47bc', holiday: '#ef9a9a', vacation: '#fff59d', task: '#ffa726', yearMarker: '#a5d6a7', semesterMarker: '#81d4fa', studentEvent: '#4db6ac', default: '#bdbdbd' };
const EVENT_BORDERS = { courseMeeting: '#1e88e5', event: '#8e24aa', holiday: '#e57373', vacation: '#ffee58', task: '#fb8c00', yearMarker: '#66bb6a', semesterMarker: '#29b6f6', studentEvent: '#26a69a', default: '#9e9e9e' };
const EVENT_TEXT_COLORS = { courseMeeting: '#000000', event: '#ffffff', holiday: '#b71c1c', vacation: '#5d4037', task: '#000000', yearMarker: '#1b5e20', semesterMarker: '#01579b', studentEvent: '#ffffff', default: '#000000' };

/**
 * Fetches and formats all events relevant to the user (public + personal) from Firestore.
 * @param {object | null} currentUser - The currently logged-in user object (from Firebase Auth + Firestore profile), needed for personal events. Should contain at least a 'uid' or 'id'.
 * @returns {Promise<Array<object>>} A promise resolving to an array of FullCalendar event objects.
 */
export const getAllVisibleEvents = async (currentUser = null) => {
  const currentUserId = currentUser?.id || currentUser?.uid; // Use 'id' if available from merged profile, else 'uid'
  console.log(`[getAllVisibleEvents] Fetching ALL events from Firestore (personal for ${currentUserId || 'guest'})`);

  try {
    // --- 1. Fetch all necessary data collections in parallel ---
    console.log("[getAllVisibleEvents] Starting parallel data fetch...");
    const [
        rawMeetings,
        rawGeneralEvents,
        rawHolidays,
        rawVacations,
        rawTasks,
        allRawStudentEvents, // Fetch all, filter later
        years,
        currentLecturersMap // Fetch lecturers map
    ] = await Promise.all([
        fetchCollection("coursesMeetings"),
        fetchCollection("events"),
        fetchCollection("holidays"),
        fetchCollection("vacations"),
        fetchCollection("tasks"),
        fetchCollection("studentEvents"), // Fetch all personal events
        fetchCollection("years"),
        getLecturersMap() // Fetch lecturers map (now async)
    ]);
    console.log("[getAllVisibleEvents] Parallel data fetch complete.");

    // --- 2. Prepare the combined events array ---
    const combinedEvents = [];

    // 3. Format Course Meetings
    try {
        const formattedMeetings = rawMeetings.map(m => { /* ... formatting logic as before ... */ }).filter(Boolean);
        combinedEvents.push(...formattedMeetings);
    } catch (err) { console.error("Error formatting meetings:", err); }

    // 4. Format General Events
    try {
        const formattedGeneralEvents = rawGeneralEvents.map(e => { /* ... formatting logic as before ... */ }).filter(Boolean);
        combinedEvents.push(...formattedGeneralEvents);
    } catch (err) { console.error("Error formatting general events:", err); }

    // 5. Format Holidays
    try {
        const formattedHolidays = rawHolidays.map(h => { /* ... formatting logic as before ... */ }).filter(Boolean);
        combinedEvents.push(...formattedHolidays);
    } catch (err) { console.error("Error formatting holidays:", err); }

    // 6. Format Vacations
     try {
        const formattedVacations = rawVacations.map(v => { /* ... formatting logic as before ... */ }).filter(Boolean);
        combinedEvents.push(...formattedVacations);
    } catch (err) { console.error("Error formatting vacations:", err); }

    // 7. Format Tasks
    try {
        const formattedTasks = rawTasks.map(t => { /* ... formatting logic as before ... */ }).filter(Boolean);
        combinedEvents.push(...formattedTasks);
    } catch (err) { console.error("Error formatting tasks:", err); }

    // 8. Format Personal Events (Filter for current user)
    if (currentUserId) {
         try {
            // Filter the fetched student events for the current user
            const myRawStudentEvents = allRawStudentEvents.filter(event => event?.studentId === currentUserId);
            const formattedPersonalEvents = myRawStudentEvents.map(e => { /* ... formatting logic as before ... */ }).filter(Boolean);
            combinedEvents.push(...formattedPersonalEvents);
             console.log(`[getAllVisibleEvents] Added ${formattedPersonalEvents.length} personal events for ${currentUserId}.`);
        } catch (err) { console.error("Error formatting personal events:", err); }
    }

    // 9. Format Year/Semester Markers (Block Display)
     try {
        const markerEvents = years.flatMap((year) => { /* ... formatting logic as before (using block display) ... */ }).filter(Boolean);
        combinedEvents.push(...markerEvents);
    } catch (err) { console.error("Error formatting markers:", err); }

    // --- 10. Return the final combined array ---
    console.log(`[getAllVisibleEvents] Returning ${combinedEvents.length} total formatted events.`);
    return combinedEvents;

  } catch (error) {
    // Catch errors from Promise.all or other general processing
    console.error("[getAllVisibleEvents] Overall error fetching or processing data:", error);
    return []; // Return empty array on failure
  }
};

// Note: The original getStudentEvents function might become redundant or could be
// simplified to just call getAllVisibleEvents(currentUser) if the only difference
// was filtering personal events.