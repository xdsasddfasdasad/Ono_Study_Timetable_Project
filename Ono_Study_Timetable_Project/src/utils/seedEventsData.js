// src/utils/seedEventsData.js

// Import Firestore service functions and DB instance
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchCollection } from "../firebase/firestoreService";

// --- ✨ שלב 1: ייבוא הפונקציה המרכזית והמתוקנת ✨ ---
import { generateCourseMeetings } from './courseMeetingGenerator'; 
// ודא שהנתיב נכון. אם שני הקבצים באותה תיקייה, זה './courseMeetingGenerator'

// Helper to check if collection is empty
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

    // 2. Load Base Data Needed for Generation
    console.log("[SeedEvents] Loading base data from Firestore...");
    const holidays = await fetchCollection("holidays");
    const vacations = await fetchCollection("vacations");
    const years = await fetchCollection("years");
    const courses = await fetchCollection("courses");
    const semesters = (years || []).flatMap((y) => y.semesters || []);
    console.log("[SeedEvents] Base data loaded from Firestore.");

    if (!courses || courses.length === 0 || !semesters || semesters.length === 0) {
         console.warn("[SeedEvents] Cannot generate meetings: Missing courses or semesters data.");
         return;
    }

    // --- ✨ שלב 3: השתמש בפונקציה המרכזית שייבאנו ✨ ---
    console.log("[SeedEvents] Generating course meetings using the central generator...");
    let allGeneratedMeetings = [];
    courses.forEach(course => {
        const semester = semesters.find(s => s.semesterCode === course.semesterCode);
        if (semester) {
            const meetingsForCourse = generateCourseMeetings(course, semester, [...(holidays || []), ...(vacations || [])]);
            allGeneratedMeetings.push(...meetingsForCourse);
        }
    });

    if (allGeneratedMeetings.length === 0) {
         console.log("[SeedEvents] No meetings were generated. Seeding complete.");
         return;
    }

    // 4. Write Generated Meetings to Firestore using Batch Write
    console.log(`[SeedEvents] Preparing to write ${allGeneratedMeetings.length} meetings to Firestore collection '${meetingsCollection}'...`);
    const batch = writeBatch(db);
    let count = 0;

    allGeneratedMeetings.forEach(meeting => {
        if (!meeting.id) {
             console.warn("[SeedEvents] Skipping meeting without an ID:", meeting);
             return;
        }
        const docRef = doc(db, meetingsCollection, meeting.id);
        // ✨ הנתונים המגיעים מהגנרטור החדש כבר בפורמט הנכון! ✨
        batch.set(docRef, meeting);
        count++;
    });

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