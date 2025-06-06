// src/utils/getStudentEvents.js - Updated for Firestore

import { formatDateTime, getExclusiveEndDate } from './eventFormatters';
import { fetchCollection, fetchDocumentsByQuery } from '../firebase/firestoreService'; // Import Firestore functions

// --- Helper Functions & Constants ---

// Cache for lecturers map
let lecturersMapCache = null;
const getLecturersMap = async () => {
    if (lecturersMapCache) return lecturersMapCache;
    console.log("[getStudentEvents:getLecturersMap] Creating lecturers map from Firestore...");
    try {
        const lecturers = await fetchCollection("lecturers");
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("[getStudentEvents:getLecturersMap] Error fetching lecturers:", error);
         lecturersMapCache = new Map();
         return lecturersMapCache;
    }
};

// Color definitions (Consistent with other files)
const EVENT_COLORS = { courseMeeting: '#42a5f5', event: '#ab47bc', holiday: '#ef9a9a', vacation: '#fff59d', task: '#ffa726', yearMarker: '#a5d6a7', semesterMarker: '#81d4fa', studentEvent: '#4db6ac', default: '#bdbdbd' };
const EVENT_BORDERS = { courseMeeting: '#1e88e5', event: '#8e24aa', holiday: '#e57373', vacation: '#ffee58', task: '#fb8c00', yearMarker: '#66bb6a', semesterMarker: '#29b6f6', studentEvent: '#26a69a', default: '#9e9e9e' };
const EVENT_TEXT_COLORS = { courseMeeting: '#000000', event: '#ffffff', holiday: '#b71c1c', vacation: '#5d4037', task: '#000000', yearMarker: '#1b5e20', semesterMarker: '#01579b', studentEvent: '#ffffff', default: '#000000' };

/**
 * Fetches and formats all events relevant to a specific student from Firestore.
 * Includes public events (courses, holidays, etc.) and the student's personal events.
 * @param {string | null} studentId - The ID (Firebase Auth UID) of the student. If null, only public events are returned.
 * @returns {Promise<Array<object>>} A promise resolving to an array of FullCalendar event objects.
 */
export const getStudentEvents = async (studentId = null) => {
  console.log(`[getStudentEvents] Fetching events from Firestore for student ID: ${studentId || 'guest'}`);

  try {
    // --- 1. Fetch all necessary data collections in parallel ---
    console.log("[getStudentEvents] Starting parallel data fetch...");
    const fetchPromises = [
        fetchCollection("coursesMeetings"),
        fetchCollection("events"),
        fetchCollection("holidays"),
        fetchCollection("vacations"),
        fetchCollection("tasks"),
        // Fetch personal events ONLY if a studentId is provided
        studentId ? fetchDocumentsByQuery("studentEvents", "studentId", "==", studentId) : Promise.resolve([]),
        fetchCollection("years"),
        getLecturersMap() // Fetch lecturers map
    ];

    const [
        rawMeetings, rawGeneralEvents, rawHolidays, rawVacations, rawTasks,
        myRawStudentEvents, // Renamed for clarity
        years, currentLecturersMap
    ] = await Promise.all(fetchPromises);
    console.log("[getStudentEvents] Parallel data fetch complete.");

    // --- 2. Prepare the combined events array ---
    const combinedEvents = [];

    // 3. Format Course Meetings (Public)
    try {
        const formattedMeetings = rawMeetings.map((m) => {
             const start = formatDateTime(m.date, m.startHour); const end = formatDateTime(m.date, m.endHour); if (!start || !end) return null;
             const lecturerName = currentLecturersMap.get(m.lecturerId);
             const type = 'courseMeeting';
             return { id: m.id, title: `${m.courseName || 'Meeting'}`, start, end, allDay: false, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-course-meeting'], extendedProps: { ...m, type, recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null } };
        }).filter(Boolean); combinedEvents.push(...formattedMeetings);
    } catch (err) { console.error("Error formatting meetings:", err); }

    // 4. Format General Events (Public)
    try {
        const formattedGeneralEvents = rawGeneralEvents.map((e) => {
            const type = 'event'; const isAllDay = String(e.allDay).toLowerCase() === 'true';
            const start = isAllDay ? e.startDate : formatDateTime(e.startDate, e.startHour);
            const end = isAllDay ? getExclusiveEndDate(e.startDate, e.endDate) : formatDateTime(e.endDate || e.startDate, e.endHour || e.startHour);
            if (!start) return null;
            return { id: e.eventCode, title: e.eventName || 'Event', start, end: isAllDay ? end : (end || start), allDay: isAllDay, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-general'], extendedProps: { ...e, type, recordTypeForModal: "event" } };
        }).filter(Boolean); combinedEvents.push(...formattedGeneralEvents);
    } catch (err) { console.error("Error formatting general events:", err); }

    // 5. Format Holidays (Public)
    try {
        const formattedHolidays = rawHolidays.map((h) => {
            if (!h.holidayCode || !h.startDate) return null;
            const type = 'holiday'; const exclusiveEnd = getExclusiveEndDate(h.startDate, h.endDate);
            return { id: h.holidayCode, title: h.holidayName || 'Holiday', start: h.startDate, end: exclusiveEnd, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-block', 'fc-event-holiday'], editable: false, extendedProps: { ...h, type, recordTypeForModal: 'holiday' } };
        }).filter(Boolean); combinedEvents.push(...formattedHolidays);
    } catch (err) { console.error("Error formatting holidays:", err); }

    // 6. Format Vacations (Public)
     try {
        const formattedVacations = rawVacations.map((v) => {
            if (!v.vacationCode || !v.startDate) return null;
            const type = 'vacation'; const exclusiveEnd = getExclusiveEndDate(v.startDate, v.endDate);
            return { id: v.vacationCode, title: v.vacationName || 'Vacation', start: v.startDate, end: exclusiveEnd, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-block', 'fc-event-vacation'], editable: false, extendedProps: { ...v, type, recordTypeForModal: 'vacation' } };
        }).filter(Boolean); combinedEvents.push(...formattedVacations);
    } catch (err) { console.error("Error formatting vacations:", err); }

    // 7. Format Tasks (Public)
    try {
        const formattedTasks = rawTasks.map(t => {
             if (!t.assignmentCode || !t.submissionDate) return null;
             const type = 'task'; const start = formatDateTime(t.submissionDate, t.submissionHour || '23:59'); if (!start) return null;
             return { id: t.assignmentCode, title: `Due: ${t.assignmentName || 'Task'}`, start, allDay: false, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-task'], editable: false, extendedProps: { ...t, type, recordTypeForModal: 'task'} };
        }).filter(Boolean); combinedEvents.push(...formattedTasks);
    } catch (err) { console.error("Error formatting tasks:", err); }

    // 8. Format Personal Events (Already filtered by query if studentId provided)
    if (studentId && myRawStudentEvents.length > 0) {
         try {
            const formattedPersonalEvents = myRawStudentEvents.map(e => {
                if (!e.eventCode || !e.startDate || !e.eventName) return null;
                const type = 'studentEvent'; const isAllDay = String(e.allDay).toLowerCase() === 'true'; let start, end;
                if (isAllDay) { start = e.startDate; end = getExclusiveEndDate(e.startDate, e.endDate); }
                else { start = formatDateTime(e.startDate, e.startHour); const endDateForTime = e.endDate || e.startDate; end = formatDateTime(endDateForTime, e.endHour); if (!end && start) { try { const d = new Date(start); d.setHours(d.getHours()+1); end=d.toISOString(); } catch {end=start;} }}
                if (!start) return null;
                return { id: e.eventCode, title: e.eventName, start, end, allDay: isAllDay, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], editable: true, classNames: ['fc-event-personal'], extendedProps: { ...e, type, recordTypeForModal: 'studentEvent' } };
            }).filter(Boolean);
            combinedEvents.push(...formattedPersonalEvents);
            console.log(`[getStudentEvents] Added ${formattedPersonalEvents.length} personal events for ${studentId}.`);
        } catch (err) { console.error("Error formatting personal events:", err); }
    }

    // 9. Format Year/Semester Markers (Block Display)
     try {
        const markerEvents = years.flatMap((year) => {
            if (!year.yearCode || !year.startDate || !year.endDate) return [];
            const markers = []; const yType = 'yearMarker'; const sType = 'semesterMarker';
            markers.push({ id: `y-start-${year.yearCode}`, title: `Y${year.yearNumber} Start`, start: year.startDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[yType], borderColor: EVENT_BORDERS[yType], textColor: EVENT_TEXT_COLORS[yType], classNames: ['fc-event-marker', 'fc-event-block-marker'], editable:false, extendedProps: { ...year, type: yType, recordTypeForModal: 'year' } });
            markers.push({ id: `y-end-${year.yearCode}`, title: `Y${year.yearNumber} End`, start: year.endDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[yType], borderColor: EVENT_BORDERS[yType], textColor: EVENT_TEXT_COLORS[yType], classNames: ['fc-event-marker', 'fc-event-block-marker'], editable:false, extendedProps: { ...year, type: yType, recordTypeForModal: 'year' } });
            (year.semesters || []).forEach((s) => {
                 if (!s.semesterCode || !s.startDate || !s.endDate) return;
                 const semData = { ...s, yearCode: year.yearCode };
                 markers.push({ id: `s-start-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} Start`, start: s.startDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[sType], borderColor: EVENT_BORDERS[sType], textColor: EVENT_TEXT_COLORS[sType], classNames: ['fc-event-marker', 'fc-event-block-marker'], editable:false, extendedProps: { ...semData, type: sType, recordTypeForModal: 'semester' } });
                 markers.push({ id: `s-end-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} End`, start: s.endDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[sType], borderColor: EVENT_BORDERS[sType], textColor: EVENT_TEXT_COLORS[sType], classNames: ['fc-event-marker', 'fc-event-block-marker'], editable:false, extendedProps: { ...semData, type: sType, recordTypeForModal: 'semester' } });
            }); return markers;
        }).filter(Boolean); combinedEvents.push(...markerEvents);
    } catch (err) { console.error("Error formatting markers:", err); }

    // --- 10. Return the final combined array ---
    console.log(`[getStudentEvents] FINISHED. Returning ${combinedEvents.length} total events for student ${studentId}.`);
    return combinedEvents;

  } catch (error) {
    console.error(`[getStudentEvents] OVERALL ERROR fetching data for student ${studentId}:`, error);
    return []; // Return empty array on critical failure
  }
};