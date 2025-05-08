import { dummyData } from "../data/dummyData";
import { hashPassword } from "./hash";
// Import Firestore service functions
import { getFirestore, collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig"; // Assuming db is exported from your config

// Helper function to check if a collection is empty
// NOTE: This reads the first document. For large collections, consider a metadata/flag document.
const isCollectionEmpty = async (collectionPath) => {
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef); // Consider query with limit(1) for efficiency
        return snapshot.empty;
    } catch (error) {
        // If collection doesn't exist yet, Firestore might throw. Treat as empty.
        // Check specific error codes if needed for more robustness.
        console.warn(`[Seed] Checking collection ${collectionPath} failed, assuming empty:`, error.code);
        return true; // Assume empty if check fails
    }
};

// Helper function to get the primary key field for seeding
// This might differ slightly from runtime logic if IDs are treated differently
const getSeedIdField = (entityKey) => {
     const map = { students: "id", years: "yearCode", lecturers: "id", sites: "siteCode", courses: "courseCode", holidays: "holidayCode", vacations: "vacationCode", events: "eventCode", tasks: "assignmentCode", studentEvents: "eventCode" };
     return map[entityKey] || 'id'; // Default to 'id' if not found
};


// --- Main Seed Function for Firestore ---
export const seedBaseData = async (force = false) => {
  console.log("[Seed] Attempting to seed base data to Firestore...");

  // 1. Seed Students (with hashed passwords)
  const studentsCollection = "students";
  try {
    const isEmpty = await isCollectionEmpty(studentsCollection);
    if (force || isEmpty) {
      console.log(`[Seed] Seeding ${studentsCollection}... (Force: ${force}, Empty: ${isEmpty})`);
      const studentsToSave = await Promise.all(
        (dummyData.students || []).map(async (student) => {
          if (!student.password || typeof student.password !== 'string') {
            return { ...student, password: null }; // Ensure password field exists but is null if missing/invalid
          }
          try {
             const hashed = await hashPassword(student.password);
             // Return student data without the original password, only hashed
             const { password, ...studentData } = student;
             return { ...studentData, password: hashed };
          } catch (hashError) {
             console.error(`[Seed] Failed to hash password for student ${student.id}:`, hashError);
             const { password, ...studentData } = student;
             return { ...studentData, password: null }; // Save without password on hash error
          }
        })
      );

      // Write each student to Firestore using their 'id' as document ID
      const promises = studentsToSave.map(student => {
          if (!student.id) {
              console.warn("[Seed] Skipping student with missing ID:", student);
              return Promise.resolve(); // Skip if ID is missing
          }
          const docRef = doc(db, studentsCollection, student.id);
          // Use setDoc to ensure the document ID is the student's ID
          return setDoc(docRef, student);
      });
      await Promise.all(promises);
      console.log(`[Seed] ${studentsToSave.length} students seeded/updated.`);

    } else { console.log(`[Seed] ${studentsCollection} collection not empty, skipping.`); }
  } catch (error) { console.error(`[Seed] Error processing or seeding ${studentsCollection}:`, error); }


  // 2. Seed Other Top-Level Collections
  const baseEntityKeys = [ "years", "lecturers", "sites", "courses", "holidays", "vacations", "events", "tasks", "studentEvents" ];

  for (const entityKey of baseEntityKeys) {
      try {
          const isEmpty = await isCollectionEmpty(entityKey);
          if (force || isEmpty) {
               console.log(`[Seed] Seeding ${entityKey}... (Force: ${force}, Empty: ${isEmpty})`);
               const items = dummyData[entityKey] || [];
               if (items.length === 0) {
                   console.log(`[Seed] No data found for ${entityKey} in dummyData.`);
                   continue;
               }
               const idField = getSeedIdField(entityKey); // Get the field containing the ID

               const promises = items.map(item => {
                    const docId = item[idField]; // Get the ID from the item's data
                    if (!docId) {
                         console.warn(`[Seed] Skipping item in ${entityKey} with missing ID field '${idField}':`, item);
                         return Promise.resolve(); // Skip if ID is missing
                    }
                    // Create a reference using the item's ID as the document ID
                    const docRef = doc(db, entityKey, String(docId)); // Ensure ID is a string
                    // Use setDoc to set the document with the specific ID
                    return setDoc(docRef, item);
               });
               await Promise.all(promises);
               console.log(`[Seed] ${items.length} items seeded/updated for ${entityKey}.`);

          } else { console.log(`[Seed] ${entityKey} collection not empty, skipping.`); }
      } catch (error) { console.error(`[Seed] Error processing or seeding ${entityKey}:`, error); }
  }

  // 3. Remove seeding for flat 'rooms' array - it's derived data now.

  console.log("[Seed] Base data seeding process to Firestore finished.");
}; // End of seedBaseData