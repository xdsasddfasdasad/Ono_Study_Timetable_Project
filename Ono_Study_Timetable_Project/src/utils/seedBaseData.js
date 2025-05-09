import { dummyData } from "../data/dummyData";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, setDoc, doc, writeBatch, query, limit } from "firebase/firestore"; // Added query, limit
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "../firebase/firebaseConfig";

const auth = getAuth(app);

// Helper function to check if a collection has at least one document
const isCollectionPopulated = async (collectionPath) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const q = query(collectionRef, limit(1)); // More efficient check
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.warn(`[SeedBase:isCollectionPopulated] Error checking ${collectionPath}, assuming not populated:`, error.message);
        return false; // If we can't check, assume it's not populated to allow seeding.
    }
};

// Helper to get the field name from dummyData that contains the intended Document ID
const getSeedIdField = (entityKey) => {
     const map = {
         students: "id", years: "yearCode", lecturers: "id", sites: "siteCode",
         courses: "courseCode", holidays: "holidayCode", vacations: "vacationCode",
         events: "eventCode", tasks: "assignmentCode", studentEvents: "eventCode"
     };
     return map[entityKey] || 'id'; // Default to 'id' if not specifically mapped
};

export const seedBaseData = async (force = false) => {
  console.log("[SeedBase] Starting base data seed to Firestore & Firebase Auth...");

  // --- 1. Seed Students (Create Auth User + Firestore Profile) ---
  const studentsCollectionName = "students";
  try {
    const studentsShouldSeed = force || !(await isCollectionPopulated(studentsCollectionName));

    if (studentsShouldSeed) {
      console.log(`[SeedBase] Seeding ${studentsCollectionName}... (Force: ${force})`);
      const studentsToSeed = dummyData.students || [];
      let createdAuthUsersCount = 0;
      let createdFirestoreProfilesCount = 0;

      for (const studentDataFromDummy of studentsToSeed) {
        if (!studentDataFromDummy.email || !studentDataFromDummy.password || !studentDataFromDummy.id) {
          console.warn("[SeedBase] Skipping student (missing email, password, or dummy ID for studentIdCard):", studentDataFromDummy.username || studentDataFromDummy.email);
          continue;
        }

        let firebaseUID = null; // Will hold the UID from Firebase Auth

        try {
          // Attempt to create user in Firebase Authentication
          console.log(`[SeedBase] Attempting to create Auth user for ${studentDataFromDummy.email}...`);
          const userCredential = await createUserWithEmailAndPassword(auth, studentDataFromDummy.email, studentDataFromDummy.password);
          firebaseUID = userCredential.user.uid; // Get the UID upon successful creation
          console.log(`[SeedBase] SUCCESS: Auth user created for ${studentDataFromDummy.email} with UID: ${firebaseUID}`);
          createdAuthUsersCount++;

          // If Auth user creation was successful, proceed to create Firestore profile
          // Note: dummyData.id will be stored as studentIdCard
          const { password, id: idFromDummy, courseCodes, eventCodes, ...profileData } = studentDataFromDummy;

          const firestoreProfileData = {
            ...profileData,             // Includes firstName, lastName, username, email, phone
            uid: firebaseUID,           // Firebase Auth UID
            id: firebaseUID,            // Using UID as the main 'id' in Firestore doc as well
            studentIdCard: idFromDummy, // The original ID from dummyData (e.g., 9-digit ID)
            courseCodes: courseCodes || [],
            eventCodes: eventCodes || [],
            createdAt: new Date().toISOString(),
            // Example: role: idFromDummy === '000000001' ? 'admin' : 'student',
          };

          const studentDocRef = doc(db, studentsCollectionName, firebaseUID); // Use firebaseUID as Document ID
          await setDoc(studentDocRef, firestoreProfileData);
          console.log(`[SeedBase] SUCCESS: Firestore profile created for ${firestoreProfileData.username} (UID: ${firebaseUID})`);
          createdFirestoreProfilesCount++;

        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.warn(`[SeedBase] Auth user for ${studentDataFromDummy.email} ALREADY EXISTS. Skipping Auth creation. Profile not created/updated by this seed pass.`);
            // If an Auth user already exists, we won't get a firebaseUID here to create a new profile.
            // For a robust seed, you might want to fetch user by email (Admin SDK) or handle this case.
            // For simplicity, this seed focuses on initial, clean creation.
          } else {
            // Other Auth errors (weak password, invalid email format, etc.)
            console.error(`[SeedBase] FAILED to create Auth user for ${studentDataFromDummy.email}:`, authError.message, `(Code: ${authError.code})`);
            // Do NOT proceed to create Firestore profile if Auth creation failed
          }
        }
      }
      console.log(`[SeedBase] Students: ${createdAuthUsersCount} new Auth users created, ${createdFirestoreProfilesCount} Firestore profiles created.`);
    } else {
      console.log(`[SeedBase] ${studentsCollectionName} collection already populated or not forced. Skipping.`);
    }
  } catch (error) {
    // Catch errors from isCollectionPopulated or other unexpected issues
    console.error(`[SeedBase] Error during student seeding process:`, error);
  }

  // --- 2. Seed Other Top-Level Collections ---
  const baseEntityKeys = [
    "years", "lecturers", "sites", "courses", "holidays",
    "vacations", "events", "tasks", "studentEvents"
    // coursesMeetings are generated by seedEventsData based on these
  ];

  for (const entityKey of baseEntityKeys) {
    try {
      const collectionShouldSeed = force || !(await isCollectionPopulated(entityKey));
      if (collectionShouldSeed) {
        if (force && (await isCollectionPopulated(entityKey))) {
          console.warn(`[SeedBase] Force seeding ${entityKey}: existing documents with the same ID will be OVERWRITTEN.`);
          // Optional: To truly clean before force seeding, delete all existing documents in the collection
          // const oldDocsSnapshot = await getDocs(collection(db, entityKey));
          // const deleteBatch = writeBatch(db);
          // oldDocsSnapshot.docs.forEach(d => deleteBatch.delete(d.ref));
          // await deleteBatch.commit();
          // console.log(`[SeedBase] Cleared existing documents in ${entityKey} due to force.`);
        }
        console.log(`[SeedBase] Seeding ${entityKey}...`);
        const itemsToSeed = dummyData[entityKey] || [];
        if (itemsToSeed.length === 0) {
          console.log(`[SeedBase] No data in dummyData for ${entityKey}.`);
          continue;
        }
        const idFieldNameInDummy = getSeedIdField(entityKey);
        const batch = writeBatch(db);
        let itemCount = 0;

        itemsToSeed.forEach(item => {
          const docId = String(item[idFieldNameInDummy]); // Ensure document ID is a string
          if (!docId) {
            console.warn(`[SeedBase] Skipping item in ${entityKey} (missing ID field '${idFieldNameInDummy}'):`, item);
            return; // Skip if no ID can be determined
          }
          const docRef = doc(db, entityKey, docId);
          batch.set(docRef, item); // setDoc will create or overwrite if ID exists
          itemCount++;
        });

        if (itemCount > 0) {
          await batch.commit();
          console.log(`[SeedBase] ${itemCount} items committed for ${entityKey}.`);
        } else {
          console.log(`[SeedBase] No valid items to seed for ${entityKey}.`);
        }
      } else {
        console.log(`[SeedBase] ${entityKey} collection already populated or not forced. Skipping.`);
      }
    } catch (error) {
      console.error(`[SeedBase] Error seeding ${entityKey}:`, error);
    }
  }
  console.log("[SeedBase] Full base data seeding process to Firestore finished.");
};