// src/utils/seedBaseData.js

// This utility file contains the logic to perform a "base" data seed. It populates the
// Firestore database with foundational data like users, courses, sites, etc., from a dummy data file.
// This script is intended for developer use only, to set up a fresh environment.

import { dummyData } from "../data/dummyData";
import { db } from "../firebase/firebaseConfig";
// Imports the necessary Firestore functions for writing data.
import { collection, setDoc, doc, writeBatch } from "firebase/firestore";
// Imports Firebase Auth functions for creating user accounts.
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Get the Firebase Auth instance.
const auth = getAuth();
// A simple helper function to create a delay, used to avoid hitting API rate limits.
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Seeds all base data into Firestore. This is a destructive and complete operation.
 * It first creates Firebase Auth users, maps their temporary usernames to their real UIDs,
 * then seeds all general data, and finally seeds student-specific data with the correct UIDs.
 */
export const seedBaseData = async () => {
  console.log(`[SeedBase] Starting full, clean seed process...`);

  // This Map is crucial. It will store the mapping between the temporary usernames
  // in `dummyData.js` and the actual, unique Firebase UID generated upon user creation.
  const usernameToUidMap = new Map();

  // --- Step 1: Create Firebase Auth users and their corresponding Firestore student profiles ---
  console.log("Step 1: Seeding Students (Auth & Firestore)...");
  const studentsToSeed = dummyData.students || [];
  // We must loop through students sequentially with a delay to avoid Firebase Auth's rate limits
  // on user creation, which are much stricter than Firestore's write limits.
  for (const studentData of studentsToSeed) {
    try {
      // Basic validation to skip incomplete records in the dummy data.
      if (!studentData.email || !studentData.password || !studentData.username) {
        console.warn(`Skipping student due to missing data:`, studentData);
        continue;
      }

      // Create the user in the Firebase Authentication service.
      const userCredential = await createUserWithEmailAndPassword(auth, studentData.email, studentData.password);
      const uid = userCredential.user.uid;
      
      // Store the mapping from the temporary username to the real UID.
      // This is essential for linking other data (like studentEvents) correctly in Step 3.
      usernameToUidMap.set(studentData.username, uid);

      // --- This section prepares the student's profile for the Firestore database ---
      // 1. Destructure the password to ensure it is NEVER stored in the database.
      // 2. Alias the `id` field from dummyData to something else to avoid confusion with the real UID.
      const { password, id: studentIdCardFromDummy, ...profileData } = studentData;
      
      // 3. Construct the final, clean Firestore profile document.
      const firestoreProfile = {
        ...profileData, // Includes firstName, lastName, email, username, courseCodes
        uid: uid,                           // The official Firebase Auth UID.
        id: uid,                            // The document's primary key, also the UID for easy lookup.
        studentIdCard: studentIdCardFromDummy, // The 9-digit national ID from the dummy data.
        createdAt: new Date().toISOString(),
      };
      
      // Use `setDoc` to create the document in the 'students' collection, using the UID as the document ID.
      await setDoc(doc(db, "students", uid), firestoreProfile);
      
      console.log(`Successfully created user: ${studentData.username} (UID: ${uid})`);
    } catch (error) {
      // Handle the common case where the user might already exist in a partially seeded database.
      if (error.code === 'auth/email-already-in-use') {
        console.warn(`Auth user for ${studentData.email} already exists. Skipping creation.`);
      } else {
        console.error(`Failed to create user ${studentData.email}:`, error);
      }
    }
    // A small delay between user creations to stay under Firebase's rate limits.
    await delay(400);
  }

  // --- Step 2: Seed all other top-level collections (non-student-specific) ---
  // This step seeds data that is general to the application, like courses, sites, etc.
  console.log("Step 2: Seeding general collections (Years, Courses, etc.)...");
  const collectionsToSeed = ["years", "lecturers", "sites", "courses", "holidays", "vacations", "events", "tasks"];
  for (const collectionName of collectionsToSeed) {
    const items = dummyData[collectionName] || [];
    if (items.length === 0) continue;

    // Use a "batch write" for performance. This combines many individual write operations
    // into a single request to Firestore, which is much faster and more efficient.
    const batch = writeBatch(db);
    items.forEach(item => {
      // Determine the document ID from the object's various possible key names (e.g., `id`, `yearCode`, `courseCode`).
      const docId = item.id || item.yearCode || item.siteCode || item.courseCode || item.holidayCode || item.vacationCode || item.eventCode || item.assignmentCode;
      if (docId) {
        // Add a 'set' operation to the batch for this document.
        batch.set(doc(db, collectionName, String(docId)), item);
      } else {
        console.warn(`Skipping item in ${collectionName} due to missing ID:`, item);
      }
    });
    // Commit the batch to execute all the writes at once.
    await batch.commit();
    console.log(`  > Seeded ${items.length} items to '${collectionName}'.`);
  }

  // --- Step 3: Seed studentEvents, replacing temporary usernames with real UIDs ---
  // This step is crucial for data integrity. It links personal events to the real users created in Step 1.
  console.log("Step 3: Seeding studentEvents with correct UIDs...");
  const studentEventsBatch = writeBatch(db);
  const studentEventsToSeed = dummyData.studentEvents || [];
  let seededEventsCount = 0;
  
  studentEventsToSeed.forEach(event => {
    // Look up the real Firebase UID from the map we created in Step 1 using the temporary username.
    const uid = usernameToUidMap.get(event.studentId);
    if (uid) {
      // If a UID was found, create the final event object with the real UID.
      const finalEvent = { ...event, studentId: uid };
      // Add the operation to the batch.
      studentEventsBatch.set(doc(db, "studentEvents", finalEvent.eventCode), finalEvent);
      seededEventsCount++;
    } else {
      // This can happen if a student in the dummy data failed to be created in Step 1.
      console.warn(`Could not find UID for username '${event.studentId}'. Skipping event:`, event);
    }
  });

  if (seededEventsCount > 0) {
    await studentEventsBatch.commit();
  }
  console.log(`  > Seeded ${seededEventsCount} items to 'studentEvents'.`);

  console.log("[SeedBase] ✅ Full seed process finished successfully.");
};