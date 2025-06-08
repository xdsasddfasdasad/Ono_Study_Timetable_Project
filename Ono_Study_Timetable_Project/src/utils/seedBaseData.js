// src/utils/seedBaseData.js

import { dummyData } from "../data/dummyData";
import { db } from "../firebase/firebaseConfig";
import { collection, setDoc, doc, writeBatch } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Seeds all base data into Firestore. This is a destructive and complete operation.
 * It first creates Firebase Auth users, maps their temporary usernames to their real UIDs,
 * then seeds all general data, and finally seeds student-specific data with the correct UIDs.
 */
export const seedBaseData = async () => {
  console.log(`[SeedBase] Starting full, clean seed process...`);

  const usernameToUidMap = new Map();

  // --- Step 1: Create Auth users and Firestore student profiles ---
  console.log("Step 1: Seeding Students (Auth & Firestore)...");
  const studentsToSeed = dummyData.students || [];
  for (const studentData of studentsToSeed) {
    try {
      if (!studentData.email || !studentData.password || !studentData.username) {
        console.warn(`Skipping student due to missing data:`, studentData);
        continue;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, studentData.email, studentData.password);
      const uid = userCredential.user.uid;
      
      // Map the temporary username from dummyData to the real Firebase UID.
      // This is crucial for linking studentEvents correctly in Step 3.
      usernameToUidMap.set(studentData.username, uid);

      // --- FIX: This is the corrected logic for creating the student profile object ---
      // 1. Destructure the password to exclude it from the profile.
      // 2. Alias the 'id' from dummyData to 'studentIdCardFromDummy' to avoid confusion.
      const { password, id: studentIdCardFromDummy, ...profileData } = studentData;
      
      // 3. Construct the final, clean Firestore profile document.
      const firestoreProfile = {
        ...profileData, // Includes firstName, lastName, email, username, courseCodes
        uid: uid,                           // The official Firebase Auth UID.
        id: uid,                            // The document's primary key, consistent with UID.
        studentIdCard: studentIdCardFromDummy, // The 9-digit national ID.
        createdAt: new Date().toISOString(),
      };
      
      // The document ID in the 'students' collection is the Firebase UID.
      await setDoc(doc(db, "students", uid), firestoreProfile);
      
      console.log(`Successfully created user: ${studentData.username} (UID: ${uid})`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.warn(`Auth user for ${studentData.email} already exists. Skipping creation.`);
      } else {
        console.error(`Failed to create user ${studentData.email}:`, error);
      }
    }
    await delay(400); // Prevent hitting Firebase Auth rate limits.
  }

  // --- Step 2: Seed all other top-level collections (non-student-specific) ---
  console.log("Step 2: Seeding general collections (Years, Courses, etc.)...");
  const collectionsToSeed = ["years", "lecturers", "sites", "courses", "holidays", "vacations", "events", "tasks"];
  for (const collectionName of collectionsToSeed) {
    const items = dummyData[collectionName] || [];
    if (items.length === 0) continue;

    const batch = writeBatch(db);
    items.forEach(item => {
      // Determine the document ID from the object's various possible key names.
      const docId = item.id || item.yearCode || item.siteCode || item.courseCode || item.holidayCode || item.vacationCode || item.eventCode || item.assignmentCode;
      if (docId) {
        batch.set(doc(db, collectionName, String(docId)), item);
      } else {
        console.warn(`Skipping item in ${collectionName} due to missing ID:`, item);
      }
    });
    await batch.commit();
    console.log(`  > Seeded ${items.length} items to '${collectionName}'.`);
  }

  // --- Step 3: Seed studentEvents, replacing temporary usernames with real UIDs ---
  console.log("Step 3: Seeding studentEvents with correct UIDs...");
  const studentEventsBatch = writeBatch(db);
  const studentEventsToSeed = dummyData.studentEvents || [];
  let seededEventsCount = 0;
  
  studentEventsToSeed.forEach(event => {
    // Find the real Firebase UID from the map we created in Step 1.
    const uid = usernameToUidMap.get(event.studentId);
    if (uid) {
      // Create the final event object with the real UID.
      const finalEvent = { ...event, studentId: uid };
      studentEventsBatch.set(doc(db, "studentEvents", finalEvent.eventCode), finalEvent);
      seededEventsCount++;
    } else {
      console.warn(`Could not find UID for username '${event.studentId}'. Skipping event:`, event);
    }
  });

  if (seededEventsCount > 0) {
    await studentEventsBatch.commit();
  }
  console.log(`  > Seeded ${seededEventsCount} items to 'studentEvents'.`);

  console.log("[SeedBase] ✅ Full seed process finished successfully.");
};