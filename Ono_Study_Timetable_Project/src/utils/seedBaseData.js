import { dummyData } from "../data/dummyData";
import { db } from "../firebase/firebaseConfig"; // Firebase DB instance
import { collection, getDocs, setDoc, doc, writeBatch, query, limit } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Auth functions
import { app } from "../firebase/firebaseConfig"; // Firebase App instance

const auth = getAuth(app); // Initialize Firebase Auth

// Helper to check if a collection likely has data (more efficient than fetching all)
const isCollectionPopulated = async (collectionPath) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const q = query(collectionRef, limit(1)); // Query for just one document
        const snapshot = await getDocs(q);
        return !snapshot.empty; // True if NOT empty (i.e., populated)
    } catch (error) {
        // If collection doesn't exist or other error, assume it's not populated for seeding purposes
        console.warn(`[SeedBase:isCollectionPopulated] Error checking '${collectionPath}', assuming not populated:`, error.message);
        return false;
    }
};

// Helper to get the field name from dummyData that contains the intended Document ID
const getSeedIdField = (entityKey) => {
     const map = {
         students: "id", // In dummyData, 'id' is the studentIdCard (9-digit)
         years: "yearCode", lecturers: "id", sites: "siteCode",
         courses: "courseCode", holidays: "holidayCode", vacations: "vacationCode",
         events: "eventCode", tasks: "assignmentCode", studentEvents: "eventCode"
     };
     return map[entityKey] || 'id'; // Default to 'id' if not mapped
};

/**
 * Seeds base data into Firestore and creates corresponding Auth users for students.
 * This function is designed to be idempotent to some extent for students
 * (won't recreate Auth user if email exists) and will overwrite other collections if forced.
 * @param {boolean} force - If true, will attempt to seed collections even if they seem populated.
 *                          For students, it won't force Auth user creation if email exists.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const seedBaseData = async (force = false) => {
  console.log(`[SeedBase] Attempting to seed base data. Force mode: ${force}`);

  // --- 1. Seed Students: Create Firebase Auth user and Firestore profile document ---
  const studentsCollectionName = "students";
  try {
    // Check if student seeding should proceed
    const studentsShouldSeed = force || !(await isCollectionPopulated(studentsCollectionName));

    if (studentsShouldSeed) {
      console.log(`[SeedBase] Seeding ${studentsCollectionName}... (Force: ${force})`);
      const studentsToSeed = dummyData.students || [];
      let createdAuthUsersCount = 0;
      let createdFirestoreProfilesCount = 0;

 // ✅ Change from map + Promise.allSettled to a sequential for...of loop for rate limiting
      for (const studentDataFromDummy of studentsToSeed) {
        if (!studentDataFromDummy.email || !studentDataFromDummy.password || !studentDataFromDummy.id) {
          console.warn("[SeedBase] Skipping student (missing data):", studentDataFromDummy.username || studentDataFromDummy.email);
          continue;
        }

        let firebaseUID = null;

        try {
          console.log(`[SeedBase] Attempting to create Auth user for ${studentDataFromDummy.email}...`);
          const userCredential = await createUserWithEmailAndPassword(auth, studentDataFromDummy.email, studentDataFromDummy.password);
          firebaseUID = userCredential.user.uid;
          console.log(`[SeedBase] SUCCESS: Auth user created for ${studentDataFromDummy.email} with UID: ${firebaseUID}`);
          createdAuthUsersCount++;

          const { password, id: idFromDummy, courseCodes, eventCodes, ...profileData } = studentDataFromDummy;
          const firestoreProfileData = {
            ...profileData, uid: firebaseUID, id: firebaseUID, studentIdCard: idFromDummy,
            courseCodes: courseCodes || [], eventCodes: eventCodes || [],
            createdAt: new Date().toISOString(),
          };
          const studentDocRef = doc(db, studentsCollectionName, firebaseUID);
          await setDoc(studentDocRef, firestoreProfileData, { merge: true });
          console.log(`[SeedBase] SUCCESS: Firestore profile created for ${profileData.username} (UID: ${firebaseUID})`);
          createdFirestoreProfilesCount++;

        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.warn(`[SeedBase] Auth user for ${studentDataFromDummy.email} ALREADY EXISTS.`);
          } else {
            console.error(`[SeedBase] FAILED to create Auth user for ${studentDataFromDummy.email}:`, authError.message, `(Code: ${authError.code})`);
            if (authError.code === 'auth/too-many-requests') {
                 console.log("[SeedBase] Rate limit hit. Waiting before next attempt...");
                 await delay(5000); // Wait 5 seconds before trying the next user
                 // Optionally, you could retry the current user, but that complicates logic.
                 // For seeding, just moving to the next after a delay is often simpler.
            }
          }
        }
        // ✅ Add a delay between each user creation attempt
        console.log(`[SeedBase] Processed ${studentDataFromDummy.email}. Waiting before next...`);
        await delay(1000); // Wait 1 second (1000ms). Adjust as needed.
      }
      console.log(`[SeedBase] Student Seeding Summary: Auth users created: ${createdAuthUsersCount}, Firestore profiles created: ${createdFirestoreProfilesCount}`);

    } else {
      console.log(`[SeedBase] ${studentsCollectionName} already populated or 'force' is false. Skipping.`);
    }
  } catch (error) {
    console.error(`[SeedBase] Error during student seeding process:`, error);
  }

  // --- 2. Seed Other Top-Level Collections (Years, Lecturers, Sites, etc.) ---
  const baseEntityKeys = [
    "years", "lecturers", "sites", "courses", "holidays",
    "vacations", "events", "tasks", "studentEvents"
    // coursesMeetings are handled by seedEventsData
  ];

  for (const entityKey of baseEntityKeys) {
    try {
      const collectionShouldSeed = force || !(await isCollectionPopulated(entityKey));
      if (collectionShouldSeed) {
        if (force && (await isCollectionPopulated(entityKey))) {
          console.warn(`[SeedBase] Force seeding ${entityKey}: existing documents with matching IDs WILL BE OVERWRITTEN.`);
          // For a true "clean and force seed", you might delete all documents in the collection first.
          // This requires listing all docs and then batch deleting, which adds complexity.
          // Current `setDoc` in batch will overwrite docs with same ID.
        }
        console.log(`[SeedBase] Seeding collection: ${entityKey}...`);
        const itemsToSeed = dummyData[entityKey] || [];
        if (itemsToSeed.length === 0) {
          console.log(`[SeedBase] No data found in dummyData for '${entityKey}'.`);
          continue;
        }
        const idFieldNameInDummy = getSeedIdField(entityKey);

        // Use batch write for efficiency
        const batch = writeBatch(db);
        let itemCountInBatch = 0;
        itemsToSeed.forEach(item => {
          const docId = String(item[idFieldNameInDummy]); // Ensure document ID is a string
          if (!docId) {
            console.warn(`[SeedBase] Skipping item in '${entityKey}' (missing ID field '${idFieldNameInDummy}'):`, item);
            return; // Skip if no ID can be determined for the document
          }
          const docRef = doc(db, entityKey, docId);
          batch.set(docRef, item); // set() will create or overwrite the document
          itemCountInBatch++;
        });

        if (itemCountInBatch > 0) {
          await batch.commit();
          console.log(`[SeedBase] Successfully committed ${itemCountInBatch} items for '${entityKey}'.`);
        } else {
          console.log(`[SeedBase] No valid items with IDs found to seed for '${entityKey}'.`);
        }
      } else {
        console.log(`[SeedBase] Collection '${entityKey}' already populated or 'force' is false. Skipping.`);
      }
    } catch (error) {
      // Catch errors from isCollectionPopulated, batch commit, etc. for this specific entityKey
      console.error(`[SeedBase] Error processing or seeding '${entityKey}':`, error);
    }
  } // End loop for baseEntityKeys

  console.log("[SeedBase] Full base data seeding process has finished.");
};