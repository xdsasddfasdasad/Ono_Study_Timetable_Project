import { dayMap } from "../data/dummyData"; // Keep dayMap if needed by generator
// Import Firestore service functions and DB instance
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Assuming db is exported
import { fetchCollection, setDocument } from "../firebase/firestoreService"; // Import fetch/set helpers

// Helper to check if collection is empty (can be moved to firestoreService if used elsewhere)
const isCollectionEmpty = async (collectionPath) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef);
        return snapshot.empty;
    } catch (error) {
        console.warn(`[SeedEvents] Checking collection ${collectionPath} failed, assuming empty:`, error.code);
        return true;
    }
};

// --- Generate Course Meetings Logic (remains mostly the same internally) ---
const generateCourseMeetings = (courses, semesters, holidaysAndVacations) => {
    const meetings = [];
    if (!courses || courses.length === 0 || !semesters || semesters.length === 0) return meetings;

    const isDateBlocked = (date, ranges) => { /* ... implementation as before ... */
        if (!ranges || ranges.length === 0) return false;
        const dateString = date.toISOString().slice(0, 10);
        return ranges.some(({ startDate, endDate }) => startDate && endDate && dateString >= startDate && dateString <= endDate);
    };


    console.log(`[SeedEvents:Generate] Generating with ${courses.length} courses, ${semesters.length} semesters...`);
    courses.forEach((course) => {
        const semester = semesters.find((s) => s.semesterCode === course.semesterCode);
        if (!semester || !semester.startDate || !semester.endDate || !Array.isArray(course.hours) || course.hours.length === 0) return;

        try {
            const start = new Date(semester.startDate + 'T00:00:00Z');
            const end = new Date(semester.endDate + 'T00:00:00Z');
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

            let currentDate = new Date(start);
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().slice(0, 10);
                const jsDay = currentDate.getUTCDay();
                const weekDay = Object.keys(dayMap).find((k) => dayMap[k] === jsDay);

                if (weekDay && !isDateBlocked(currentDate, holidaysAndVacations)) {
                    const matchingSlots = course.hours.filter(h => h.day === weekDay && h.start && h.end);
                    matchingSlots.forEach(slot => {
                        // ✅ Ensure generated ID is suitable for Firestore document ID (no slashes etc.)
                        // Using '-' should be fine. Keep it relatively unique.
                        const meetingId = `CM-${course.courseCode}-${dateStr}-${slot.start.replace(':', '')}`;
                        meetings.push({
                            id: meetingId, // Include ID in the data as well
                            courseCode: course.courseCode, courseName: course.courseName || "", type: "courseMeeting",
                            date: dateStr, startHour: slot.start, endHour: slot.end, allDay: false,
                            roomCode: course.roomCode || null, lecturerId: course.lecturerId || null, semesterCode: course.semesterCode,
                            notes: course.notes || "", zoomMeetinglink: course.zoomMeetinglink || "",
                        });
                    });
                }
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        } catch (error) {
             console.error(`[SeedEvents:Generate] Error during date iteration for course ${course.courseCode}:`, error);
        }
    });
    console.log(`[SeedEvents:Generate] Generated ${meetings.length} total raw meetings.`);
    return meetings;
};


// --- Main Seeding Function for Course Meetings to Firestore ---
export const seedEventsData = async (force = false) => {
  const meetingsCollection = "coursesMeetings";
  console.log(`[SeedEvents] STARTING seeding for ${meetingsCollection}. Force mode: ${force}`);

  try {
    // 1. Check if seeding is needed
    const isEmpty = await isCollectionEmpty(meetingsCollection);
    if (!force && !isEmpty) {
      console.log(`[SeedEvents] ${meetingsCollection} collection not empty and force=false, skipping.`);
      return;
    }

    console.log(`[SeedEvents] Proceeding with seed (Force: ${force}, Empty: ${isEmpty})`);

    // 2. Load Base Data Needed for Generation (FROM FIRESTORE)
    console.log("[SeedEvents] Loading base data from Firestore...");
    const holidays = await fetchCollection("holidays");
    const vacations = await fetchCollection("vacations");
    const years = await fetchCollection("years"); // Fetches year documents
    const courses = await fetchCollection("courses"); // Fetches course definitions
    const semesters = (years || []).flatMap((y) => y.semesters || []); // Extract semesters from years data
    console.log("[SeedEvents] Base data loaded from Firestore.");

    // Check if essential data exists
    if (!courses || courses.length === 0 || !semesters || semesters.length === 0) {
         console.warn("[SeedEvents] Cannot generate meetings: Missing courses or semesters data from Firestore.");
         return;
    }

    // 3. Generate Course Meetings in Memory
    console.log("[SeedEvents] Generating raw course meetings...");
    const generatedMeetings = generateCourseMeetings(courses, semesters, [...holidays, ...vacations]);

    if (generatedMeetings.length === 0) {
         console.log("[SeedEvents] No meetings were generated. Seeding complete.");
         return;
    }

    // 4. Write Generated Meetings to Firestore using Batch Write
    console.log(`[SeedEvents] Preparing to write ${generatedMeetings.length} meetings to Firestore collection '${meetingsCollection}'...`);
    const batch = writeBatch(db);
    let count = 0;

    generatedMeetings.forEach(meeting => {
        if (!meeting.id) {
             console.warn("[SeedEvents] Skipping meeting without an ID:", meeting);
             return; // Skip meetings without a valid ID
        }
        // Create a document reference using the generated meeting ID
        const docRef = doc(db, meetingsCollection, meeting.id);
        // Add a 'set' operation to the batch (overwrites if ID exists)
        batch.set(docRef, meeting);
        count++;
        // Firestore batch writes have a limit (around 500 operations).
        // For very large seeds, you'd need to commit in chunks. Not likely needed here.
    });

    if (count > 0) {
        await batch.commit(); // Commit all the writes in the batch
        console.log(`[SeedEvents] Successfully wrote ${count} meetings to Firestore.`);
    } else {
         console.log("[SeedEvents] No valid meetings with IDs were generated to write.");
    }

  } catch (error) {
    // Catch errors from Firestore fetching or batch writing
    console.error("[SeedEvents] OVERALL ERROR during seeding:", error);
  } finally {
    console.log(`[SeedEvents] Seeding process for ${meetingsCollection} finished.`);
  }
};