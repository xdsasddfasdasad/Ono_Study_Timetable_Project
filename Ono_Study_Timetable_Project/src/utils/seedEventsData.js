// src/utils/seedEventsData.js

// This utility file is specifically responsible for seeding the `coursesMeetings` collection.
// It uses the course definitions and semester schedules seeded by `seedBaseData.js`
// to generate all the individual class meeting events for the entire academic calendar.

// Import Firestore service functions and the DB instance.
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchCollection } from "../firebase/firestoreService";

// --- ✨ Step 1: Import the central, corrected generator function. ✨ ---
// This ensures that the generation logic is consistent and maintained in one place.
import { generateCourseMeetings } from './courseMeetingGenerator'; 

// A helper function to check if a Firestore collection is empty.
// This is used as a safety measure to prevent accidentally re-seeding data.
const isCollectionEmpty = async (collectionPath) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef);
        return snapshot.empty;
    } catch (error) {
        // If there's an error (e.g., permissions issue), assume it's empty to be safe, but log a warning.
        console.warn(`[SeedEvents] Checking collection ${collectionPath} failed, assuming empty:`, error.code);
        return true;
    }
};

// --- Main Seeding Function for Course Meetings to Firestore ---
// This is the main exported function that orchestrates the event seeding process.
export const seedEventsData = async (force = false) => {
  const meetingsCollection = "coursesMeetings";
  console.log(`[SeedEvents] STARTING seeding for ${meetingsCollection}. Force mode: ${force}`);

  try {
    // 1. Safety Check: See if the target collection already has data.
    const isEmpty = await isCollectionEmpty(meetingsCollection);
    // If the collection is not empty and the `force` flag is false, skip the entire process.
    if (!force && !isEmpty) {
      console.log(`[SeedEvents] ${meetingsCollection} collection not empty and force=false, skipping.`);
      return;
    }

    console.log(`[SeedEvents] Proceeding with seed (Force: ${force}, Empty: ${isEmpty})`);

    // 2. Load Base Data Needed for Generation
    // Before we can generate meetings, we need the raw materials: courses, years (with semesters), and holidays.
    console.log("[SeedEvents] Loading base data from Firestore...");
    const holidays = await fetchCollection("holidays");
    const vacations = await fetchCollection("vacations");
    const years = await fetchCollection("years");
    const courses = await fetchCollection("courses");
    // Flatten the nested semester data from all years into a single, easily searchable array.
    const semesters = (years || []).flatMap((y) => y.semesters || []);
    console.log("[SeedEvents] Base data loaded from Firestore.");

    if (!courses || courses.length === 0 || !semesters || semesters.length === 0) {
         console.warn("[SeedEvents] Cannot generate meetings: Missing courses or semesters data.");
         return;
    }

    // --- ✨ Step 3: Use the central, imported generator function. ✨ ---
    // This is where the core logic happens. We delegate the complex task of generation to our utility.
    console.log("[SeedEvents] Generating course meetings using the central generator...");
    let allGeneratedMeetings = [];
    // Iterate over every course definition.
    courses.forEach(course => {
        // Find the corresponding semester object for this course.
        const semester = semesters.find(s => s.semesterCode === course.semesterCode);
        if (semester) {
            // If the semester is found, call the generator to create all meeting instances for this course.
            const meetingsForCourse = generateCourseMeetings(course, semester, [...(holidays || []), ...(vacations || [])]);
            // Add the newly generated meetings to our master list.
            allGeneratedMeetings.push(...meetingsForCourse);
        }
    });

    if (allGeneratedMeetings.length === 0) {
         console.log("[SeedEvents] No meetings were generated. Seeding complete.");
         return;
    }

    // 4. Write Generated Meetings to Firestore using a Batch Write
    // Using a batch write is significantly more efficient for writing many documents at once.
    console.log(`[SeedEvents] Preparing to write ${allGeneratedMeetings.length} meetings to Firestore collection '${meetingsCollection}'...`);
    const batch = writeBatch(db);
    let count = 0;

    allGeneratedMeetings.forEach(meeting => {
        // A final check to ensure the meeting object has a valid ID before trying to write it.
        if (!meeting.id) {
             console.warn("[SeedEvents] Skipping meeting without an ID:", meeting);
             return;
        }
        const docRef = doc(db, meetingsCollection, meeting.id);
        // Add a 'set' operation to the batch. The data from the new generator is already in the correct format.
        batch.set(docRef, meeting);
        count++;
    });

    // Only commit the batch if there are valid meetings to write.
    if (count > 0) {
        await batch.commit();
        console.log(`[SeedEvents] Successfully wrote ${count} new-format meetings to Firestore.`);
    } else {
         console.log("[SeedEvents] No valid meetings with IDs were generated to write.");
    }

  } catch (error) {
    console.error("[SeedEvents] OVERALL ERROR during seeding:", error);
  } finally {
    console.log(`[SeedEvents] Seeding process for ${meetingsCollection} finished.`);
  }
};