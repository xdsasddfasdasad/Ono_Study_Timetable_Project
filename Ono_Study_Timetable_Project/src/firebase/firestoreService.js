// src/firebase/firestoreService.js

import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, getDocs, getDoc, doc,
    addDoc, setDoc, updateDoc, deleteDoc, writeBatch, query, where
} from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig'; // Import your config

// Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Get Firestore instance

// --- Basic CRUD Functions ---

/**
 * Fetches all documents from a specified collection.
 * @param {string} collectionPath - The path to the collection (e.g., 'students', 'courses').
 * @returns {Promise<Array<object>>} - A promise resolving to an array of document data objects with their IDs.
 */
export const fetchCollection = async (collectionPath) => {
    console.log(`[Firestore] Fetching collection: ${collectionPath}`);
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef);
        if (snapshot.empty) {
            console.log(`[Firestore] No documents found in ${collectionPath}.`);
            return [];
        }
        // Map documents to include their ID along with the data
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firestore] Fetched ${data.length} documents from ${collectionPath}.`);
        return data;
    } catch (error) {
        console.error(`[Firestore] Error fetching collection ${collectionPath}:`, error);
        throw error; // Re-throw error to be caught by the caller
    }
};

/**
 * Fetches a single document by its ID from a specified collection.
 * @param {string} collectionPath - The path to the collection.
 * @param {string} documentId - The ID of the document to fetch.
 * @returns {Promise<object|null>} - A promise resolving to the document data object with its ID, or null if not found.
 */
export const fetchDocumentById = async (collectionPath, documentId) => {
    console.log(`[Firestore] Fetching document: ${collectionPath}/${documentId}`);
     if (!documentId) { console.warn("[Firestore] fetchDocumentById called with no ID."); return null; }
    try {
        const docRef = doc(db, collectionPath, documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() };
            console.log(`[Firestore] Document fetched successfully.`);
            return data;
        } else {
            console.log(`[Firestore] Document ${documentId} not found in ${collectionPath}.`);
            return null;
        }
    } catch (error) {
        console.error(`[Firestore] Error fetching document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};


/**
 * Adds a new document to a specified collection with a Firestore-generated ID.
 * @param {string} collectionPath - The path to the collection.
 * @param {object} data - The data object to add (without an 'id' field).
 * @returns {Promise<string>} - A promise resolving to the ID of the newly created document.
 */
export const addDocument = async (collectionPath, data) => {
    console.log(`[Firestore] Adding document to ${collectionPath}:`, data);
    try {
        // Ensure data doesn't include an 'id' field if Firestore should generate it
        const dataToAdd = { ...data };
        if ('id' in dataToAdd) {
             console.warn("[Firestore] 'id' field found in data for addDocument, Firestore will generate its own ID.");
             // Decide if you want to remove it or let Firestore handle it (it usually ignores it)
             // delete dataToAdd.id;
        }
        const collectionRef = collection(db, collectionPath);
        const docRef = await addDoc(collectionRef, dataToAdd);
        console.log(`[Firestore] Document added successfully with ID: ${docRef.id}`);
        return docRef.id; // Return the new ID
    } catch (error) {
        console.error(`[Firestore] Error adding document to ${collectionPath}:`, error);
        throw error;
    }
};

/**
 * Adds or completely overwrites a document in a specified collection with a specific ID.
 * If the document does not exist, it will be created. If it does exist, its contents will be replaced.
 * @param {string} collectionPath - The path to the collection.
 * @param {string} documentId - The ID to use for the document.
 * @param {object} data - The data object to set (can include or exclude the 'id' field).
 * @returns {Promise<void>} - A promise resolving when the operation is complete.
 */
export const setDocument = async (collectionPath, documentId, data) => {
    console.log(`[Firestore] Setting document: ${collectionPath}/${documentId}`);
    if (!documentId) { throw new Error("[Firestore] Document ID is required for setDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        // setDoc overwrites the document completely.
        await setDoc(docRef, data);
        console.log(`[Firestore] Document set successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error setting document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

/**
 * Updates specific fields of an existing document. Does not overwrite the entire document.
 * Fails if the document does not exist.
 * @param {string} collectionPath - The path to the collection.
 * @param {string} documentId - The ID of the document to update.
 * @param {object} data - An object containing the fields and values to update.
 * @returns {Promise<void>} - A promise resolving when the operation is complete.
 */
export const updateDocument = async (collectionPath, documentId, data) => {
     console.log(`[Firestore] Updating document: ${collectionPath}/${documentId}`);
     if (!documentId) { throw new Error("[Firestore] Document ID is required for updateDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        // updateDoc only changes specified fields and fails if doc doesn't exist
        await updateDoc(docRef, data);
        console.log(`[Firestore] Document updated successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error updating document ${collectionPath}/${documentId}:`, error);
        throw error; // Let caller handle (e.g., maybe doc didn't exist)
    }
};

/**
 * Deletes a document by its ID from a specified collection.
 * @param {string} collectionPath - The path to the collection.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<void>} - A promise resolving when the operation is complete.
 */
export const deleteDocument = async (collectionPath, documentId) => {
    console.log(`[Firestore] Deleting document: ${collectionPath}/${documentId}`);
    if (!documentId) { throw new Error("[Firestore] Document ID is required for deleteDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        await deleteDoc(docRef);
        console.log(`[Firestore] Document deleted successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error deleting document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

// --- Add more specific or complex functions as needed ---
// Example: Querying documents based on a field
export const fetchDocumentsByQuery = async (collectionPath, fieldName, operator, value) => {
     console.log(`[Firestore] Querying ${collectionPath} where ${fieldName} ${operator} ${value}`);
     try {
         const collectionRef = collection(db, collectionPath);
         const q = query(collectionRef, where(fieldName, operator, value));
         const snapshot = await getDocs(q);
         if (snapshot.empty) {
             console.log(`[Firestore] No documents found for query.`);
             return [];
         }
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         console.log(`[Firestore] Fetched ${data.length} documents matching query.`);
         return data;
     } catch (error) {
         console.error(`[Firestore] Error querying collection ${collectionPath}:`, error);
         throw error;
     }
};

// Example: Function to handle batch writes (add/update/delete multiple docs atomically)
export const performBatchWrites = async (writes) => {
     console.log(`[Firestore] Performing ${writes.length} batch writes.`);
     const batch = writeBatch(db);
     try {
          writes.forEach(write => {
               const docRef = doc(db, write.collectionPath, write.documentId);
               if (write.type === 'set') {
                    batch.set(docRef, write.data);
               } else if (write.type === 'update') {
                    batch.update(docRef, write.data);
               } else if (write.type === 'delete') {
                    batch.delete(docRef);
               }
          });
          await batch.commit();
          console.log(`[Firestore] Batch write successful.`);
          return true;
     } catch (error) {
          console.error(`[Firestore] Error performing batch writes:`, error);
          throw error;
     }
};

// --- Functions for Nested Data (Example for Semesters within Years) ---

/**
 * Adds or updates a semester within the 'semesters' array of a specific year document.
 * This uses updateDoc on the parent year document.
 * @param {string} yearId - The yearCode (document ID) of the parent year.
 * @param {object} semesterData - The semester object to add or update (must include semesterCode).
 * @returns {Promise<void>}
 */
export const saveSemesterInYear = async (yearId, semesterData) => {
    if (!yearId || !semesterData?.semesterCode) {
        throw new Error("Year ID and Semester Data (with semesterCode) are required.");
    }
    console.log(`[Firestore] Saving semester ${semesterData.semesterCode} in year ${yearId}`);
    const yearRef = doc(db, 'years', yearId);
    try {
        const yearSnap = await getDoc(yearRef);
        if (!yearSnap.exists()) { throw new Error(`Year document ${yearId} not found.`); }

        const yearData = yearSnap.data();
        const semesters = yearData.semesters || [];
        const existingIndex = semesters.findIndex(s => s.semesterCode === semesterData.semesterCode);

        if (existingIndex > -1) { // Update existing
            semesters[existingIndex] = { ...semesters[existingIndex], ...semesterData };
             console.log(`[Firestore] Updating existing semester ${semesterData.semesterCode}.`);
        } else { // Add new
            semesters.push(semesterData);
             console.log(`[Firestore] Adding new semester ${semesterData.semesterCode}.`);
        }

        // Update the entire 'semesters' array field in the year document
        await updateDoc(yearRef, { semesters: semesters });
        console.log(`[Firestore] Successfully updated semesters array for year ${yearId}.`);

    } catch (error) {
         console.error(`[Firestore] Error saving semester in year ${yearId}:`, error);
         throw error;
    }
};

/**
 * Deletes a semester from the 'semesters' array of a specific year document.
 * @param {string} yearId - The yearCode (document ID) of the parent year.
 * @param {string} semesterCodeToDelete - The semesterCode of the semester to delete.
 * @returns {Promise<void>}
 */
export const deleteSemesterFromYear = async (yearId, semesterCodeToDelete) => {
     if (!yearId || !semesterCodeToDelete) {
         throw new Error("Year ID and Semester Code are required for deletion.");
     }
     console.log(`[Firestore] Deleting semester ${semesterCodeToDelete} from year ${yearId}`);
     const yearRef = doc(db, 'years', yearId);
     try {
         const yearSnap = await getDoc(yearRef);
         if (!yearSnap.exists()) { console.warn(`Year document ${yearId} not found. Cannot delete semester.`); return; }

         const yearData = yearSnap.data();
         const semesters = yearData.semesters || [];
         const initialLength = semesters.length;
         const updatedSemesters = semesters.filter(s => s.semesterCode !== semesterCodeToDelete);

         if (updatedSemesters.length < initialLength) {
             // Only update if a semester was actually removed
             await updateDoc(yearRef, { semesters: updatedSemesters });
             console.log(`[Firestore] Successfully deleted semester ${semesterCodeToDelete} from year ${yearId}.`);
         } else {
             console.warn(`[Firestore] Semester ${semesterCodeToDelete} not found in year ${yearId}. No changes made.`);
         }
     } catch (error) {
         console.error(`[Firestore] Error deleting semester ${semesterCodeToDelete} from year ${yearId}:`, error);
         throw error;
     }
};
// --- Functions for Nested Rooms within Sites ---

/**
 * Adds or updates a room within the 'rooms' array of a specific site document.
 * Uses updateDoc on the parent site document.
 * @param {string} siteId - The siteCode (document ID) of the parent site.
 * @param {object} roomData - The room object to add or update (must include roomCode).
 *   Should contain only room-specific fields (e.g., roomCode, roomName, notes).
 * @returns {Promise<void>}
 */
export const saveRoomInSite = async (siteId, roomData) => {
    if (!siteId || !roomData?.roomCode) {
        throw new Error("Site ID and Room Data (with roomCode) are required.");
    }
    console.log(`[Firestore] Saving room ${roomData.roomCode} in site ${siteId}`);
    const siteRef = doc(db, 'sites', siteId); // Document reference for the specific site
    try {
        const siteSnap = await getDoc(siteRef);
        if (!siteSnap.exists()) { throw new Error(`Site document ${siteId} not found.`); }

        const siteData = siteSnap.data();
        const rooms = siteData.rooms || []; // Get existing rooms array or initialize empty
        const existingIndex = rooms.findIndex(r => r.roomCode === roomData.roomCode);

        // Ensure we only save relevant room fields into the array
        const cleanRoomData = {
             roomCode: roomData.roomCode,
             roomName: roomData.roomName || "", // Default empty if missing
             notes: roomData.notes || ""       // Default empty if missing
             // Add any other fields that belong *only* to the room object itself
        };


        if (existingIndex > -1) { // Update existing room
            // Merge new data onto existing data in the array
            rooms[existingIndex] = { ...rooms[existingIndex], ...cleanRoomData };
             console.log(`[Firestore] Updating existing room ${roomData.roomCode} in site ${siteId}.`);
        } else { // Add new room
            rooms.push(cleanRoomData);
             console.log(`[Firestore] Adding new room ${roomData.roomCode} to site ${siteId}.`);
        }

        // Update the entire 'rooms' array field in the site document
        await updateDoc(siteRef, { rooms: rooms });
        console.log(`[Firestore] Successfully updated rooms array for site ${siteId}.`);

    } catch (error) {
         console.error(`[Firestore] Error saving room in site ${siteId}:`, error);
         throw error;
    }
};

/**
 * Deletes a room from the 'rooms' array of a specific site document.
 * @param {string} siteId - The siteCode (document ID) of the parent site.
 * @param {string} roomCodeToDelete - The roomCode of the room to delete.
 * @returns {Promise<void>}
 */
export const deleteRoomFromSite = async (siteId, roomCodeToDelete) => {
     if (!siteId || !roomCodeToDelete) {
         throw new Error("Site ID and Room Code are required for deletion.");
     }
     console.log(`[Firestore] Deleting room ${roomCodeToDelete} from site ${siteId}`);
     const siteRef = doc(db, 'sites', siteId);
     try {
         const siteSnap = await getDoc(siteRef);
         // If site doesn't exist, room effectively doesn't exist either
         if (!siteSnap.exists()) { console.warn(`Site document ${siteId} not found. Cannot delete room.`); return; }

         const siteData = siteSnap.data();
         const rooms = siteData.rooms || [];
         const initialLength = rooms.length;
         // Filter out the room to be deleted
         const updatedRooms = rooms.filter(r => r.roomCode !== roomCodeToDelete);

         // Only update the document if a room was actually removed
         if (updatedRooms.length < initialLength) {
             // Update the 'rooms' array field in the site document
             await updateDoc(siteRef, { rooms: updatedRooms });
             console.log(`[Firestore] Successfully deleted room ${roomCodeToDelete} from site ${siteId}.`);
         } else {
             console.warn(`[Firestore] Room ${roomCodeToDelete} not found in site ${siteId}. No changes made.`);
             // Consider if "not found" should throw an error or just complete silently
             // Throwing might be better for consistency if the caller expects it to exist
             // throw new Error(`Room ${roomCodeToDelete} not found in site ${siteId}.`);
         }
     } catch (error) {
         console.error(`[Firestore] Error deleting room ${roomCodeToDelete} from site ${siteId}:`, error);
         throw error;
     }
};

// You can add more specific functions here, e.g., fetching all rooms across all sites
/**
 * Fetches all rooms from all sites.
 * @returns {Promise<Array<object>>} A promise resolving to a flat array of all room objects, each including its siteCode.
 */
export const fetchAllRooms = async () => {
     console.log("[Firestore] Fetching all rooms from all sites...");
     try {
         const sites = await fetchCollection('sites'); // Fetch all site documents
         const allRooms = sites.flatMap(site =>
             (site.rooms || []).map(room => ({
                 ...room,
                 siteCode: site.siteCode, // Add parent siteCode for context
                 siteName: site.siteName   // Optionally add siteName too
             }))
         );
         console.log(`[Firestore] Fetched a total of ${allRooms.length} rooms.`);
         return allRooms;
     } catch (error) {
         console.error("[Firestore] Error fetching all rooms:", error);
         throw error;
     }
 };

// Add similar functions for Rooms within Sites if you choose to model them as nested arrays.