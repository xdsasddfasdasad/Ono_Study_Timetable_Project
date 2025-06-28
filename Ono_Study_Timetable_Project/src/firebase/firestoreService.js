// src/firebase/firestoreService.js

// This file serves as a comprehensive service layer for all interactions with Firebase Firestore and Storage.
// It abstracts the raw Firebase SDK calls into clean, reusable functions. This pattern, often called the
// "Repository Pattern", centralizes data access logic, making the rest of the application cleaner and easier to maintain.

// Import Firestore functions from the SDK
import {
    collection, getDocs, getDoc, doc,
    addDoc, setDoc, updateDoc, deleteDoc, writeBatch, query, where
} from "firebase/firestore";

// ✅ Import the initialized 'db' and 'app' instances ONCE from your firebaseConfig
import { db, app } from './firebaseConfig'; // Adjust path if needed
// Import Firebase Storage functions
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Initialize the Firebase Storage instance.
const storage = getStorage(app);

// Define constants for the special collection and document used to track the database seeding status.
const SEED_FLAG_COLLECTION = '_app_seed_status';
const SEED_FLAG_DOC_ID = 'initialSeedDone';


/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param {File} file - The file object to upload.
 * @param {string} path - The destination path in storage (e.g., 'message-attachments/some-id').
 * @returns {Promise<{downloadURL: string, filePath: string}>} The public download URL and full storage path of the uploaded file.
 */
export const uploadFile = async (file, path) => {
    if (!file || !path) throw new Error("File and path are required for upload.");
    
    // Create a reference to the full path of the file in Firebase Storage.
    const storageRef = ref(storage, `${path}/${file.name}`);
    console.log(`[FirestoreService] Uploading file to: ${storageRef.fullPath}`);
    
    // Upload the file bytes to the specified reference.
    const snapshot = await uploadBytes(storageRef, file);
    // After uploading, get the public URL to access the file.
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[FirestoreService] File uploaded successfully. URL:', downloadURL);
    return { downloadURL, filePath: snapshot.ref.fullPath };
};

/**
 * Checks if the initial database seed has already been performed by looking for a specific flag document.
 * @returns {Promise<boolean>} True if seeding was already done, false otherwise.
 */
export const hasInitialSeedBeenPerformed = async () => {
    try {
        const flagDocRef = doc(db, SEED_FLAG_COLLECTION, SEED_FLAG_DOC_ID);
        const docSnap = await getDoc(flagDocRef);
        // The seed is considered done if the document exists and has a status of true.
        return docSnap.exists() && docSnap.data().status === true;
    } catch (error) {
        console.error("[FirestoreService] Error checking seed flag:", error);
        return false; // Assume not seeded if any error occurs.
    }
};

/**
 * Sets the flag in Firestore indicating that the initial database seed has been successfully performed.
 * @returns {Promise<void>}
 */
export const markInitialSeedAsPerformed = async () => {
    try {
        const flagDocRef = doc(db, SEED_FLAG_COLLECTION, SEED_FLAG_DOC_ID);
        // Create or overwrite the flag document with a status and timestamp.
        await setDoc(flagDocRef, { status: true, timestamp: new Date().toISOString() });
        console.log("[FirestoreService] Initial seed flag set to true.");
    } catch (error) {
        console.error("[FirestoreService] Error setting seed flag:", error);
        throw error; // Propagate the error to the caller.
    }
};

// --- Basic CRUD (Create, Read, Update, Delete) Functions ---

/**
 * Fetches all documents from a specified top-level collection.
 * @param {string} collectionPath - The name of the collection.
 * @returns {Promise<Array>} An array of document objects, each with its ID.
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
        // Map the results to a more useful format, including the document ID in each object.
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firestore] Fetched ${data.length} documents from ${collectionPath}.`);
        return data;
    } catch (error) {
        console.error(`[Firestore] Error fetching collection ${collectionPath}:`, error);
        throw error;
    }
};

/**
 * Fetches a single document by its ID from a specified collection.
 * @param {string} collectionPath - The name of the collection.
 * @param {string} documentId - The ID of the document to fetch.
 * @returns {Promise<Object|null>} The document object with its ID, or null if not found.
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
 * Adds a new document to a collection. Firestore will automatically generate an ID.
 * @param {string} collectionPath - The name of the collection.
 * @param {Object} data - The data object for the new document.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export const addDocument = async (collectionPath, data) => {
    console.log(`[Firestore] Adding document to ${collectionPath}:`, data);
    try {
        const dataToAdd = { ...data };
        const collectionRef = collection(db, collectionPath);
        const docRef = await addDoc(collectionRef, dataToAdd);
        console.log(`[Firestore] Document added successfully with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error(`[Firestore] Error adding document to ${collectionPath}:`, error);
        throw error;
    }
};

/**
 * Creates a new document with a specific ID, or overwrites an existing document with that ID.
 * @param {string} collectionPath - The name of the collection.
 * @param {string} documentId - The specific ID for the document.
 * @param {Object} data - The data for the document.
 */
export const setDocument = async (collectionPath, documentId, data) => {
    console.log(`[Firestore] Setting document: ${collectionPath}/${documentId}`);
    if (!documentId) { throw new Error("[Firestore] Document ID is required for setDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        await setDoc(docRef, data); // Overwrites or creates.
        console.log(`[Firestore] Document set successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error setting document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

/**
 * Updates an existing document. This merges the new data with existing data. It fails if the document does not exist.
 * @param {string} collectionPath - The name of the collection.
 * @param {string} documentId - The ID of the document to update.
 * @param {Object} data - The fields to update.
 */
export const updateDocument = async (collectionPath, documentId, data) => {
     console.log(`[Firestore] Updating document: ${collectionPath}/${documentId}`);
     if (!documentId) { throw new Error("[Firestore] Document ID is required for updateDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        await updateDoc(docRef, data); // Merges data, fails if doc doesn't exist.
        console.log(`[Firestore] Document updated successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error updating document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

/**
 * Deletes a document from a collection.
 * @param {string} collectionPath - The name of the collection.
 * @param {string} documentId - The ID of the document to delete.
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

/**
 * Fetches documents based on a simple query (e.g., where field == value).
 * @deprecated This function is kept for legacy purposes. Use `fetchCollectionWithQuery` for more flexibility.
 * @param {string} collectionPath - The name of the collection.
 * @param {string} fieldName - The field to query against.
 * @param {*} operator - The query operator (e.g., '==', '>', '<', 'in').
 * @param {*} value - The value to compare against.
 * @returns {Promise<Array>} An array of matching documents.
 */
export const fetchDocumentsByQuery = async (collectionPath, fieldName, operator, value) => {
     console.log(`[Firestore] Querying ${collectionPath} where ${fieldName} ${operator} ${value}`);
     try {
         const collectionRef = collection(db, collectionPath);
         const q = query(collectionRef, where(fieldName, operator, value));
         const snapshot = await getDocs(q);
         if (snapshot.empty) { return []; }
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         console.log(`[Firestore] Fetched ${data.length} documents by query.`);
         return data;
     } catch (error) {
         console.error(`[Firestore] Error querying collection ${collectionPath}:`, error);
         throw error;
     }
};

/**
 * Performs multiple write operations (set, update, delete) as a single atomic batch.
 * The entire batch will either succeed or fail together.
 * @param {Array<Object>} writes - An array of write operation objects.
 * Each object should have `type`, `collectionPath`, `documentId`, and `data` (for set/update).
 * @returns {Promise<boolean>} True if the batch commit was successful.
 */
export const performBatchWrites = async (writes) => {
     console.log(`[Firestore] Performing ${writes.length} batch writes.`);
     // Create a new batch instance.
     const batch = writeBatch(db);
     try {
          // Iterate over the array of write operations and add each one to the batch.
          writes.forEach(writeOp => {
               if (!writeOp.collectionPath || !writeOp.documentId) {
                    console.error("Invalid write operation:", writeOp);
                    throw new Error("Batch write operation missing collectionPath or documentId.");
               }
               const docRef = doc(db, writeOp.collectionPath, writeOp.documentId);
               if (writeOp.type === 'set')      batch.set(docRef, writeOp.data);
               else if (writeOp.type === 'update') batch.update(docRef, writeOp.data);
               else if (writeOp.type === 'delete') batch.delete(docRef);
               else console.warn("Unknown batch write type:", writeOp.type);
          });
          // Commit all the writes in the batch to Firestore.
          await batch.commit();
          console.log(`[Firestore] Batch write successful.`);
          return true;
     } catch (error) {
          console.error(`[Firestore] Error performing batch writes:`, error);
          throw error;
     }
};

// --- Functions for Nested Semesters within Years ---
/**
 * Saves or updates a semester object within the 'semesters' array of a specific year document.
 * @param {string} yearId - The ID of the parent year document.
 * @param {Object} semesterData - The semester data to save.
 */
export const saveSemesterInYear = async (yearId, semesterData) => {
    if (!yearId || !semesterData?.semesterCode) throw new Error("Year ID and Semester Data (with semesterCode) are required.");
    const yearRef = doc(db, 'years', yearId);
    try {
        const yearSnap = await getDoc(yearRef);
        if (!yearSnap.exists()) throw new Error(`Year document ${yearId} not found.`);
        const yearData = yearSnap.data();
        const semesters = yearData.semesters || [];
        const existingIndex = semesters.findIndex(s => s.semesterCode === semesterData.semesterCode);
        // Ensure only relevant fields are saved.
        const cleanSemesterData = { semesterCode: semesterData.semesterCode, semesterNumber: semesterData.semesterNumber || "", startDate: semesterData.startDate, endDate: semesterData.endDate };
        if (existingIndex > -1) {
            // If the semester exists, update it in the array.
            semesters[existingIndex] = { ...semesters[existingIndex], ...cleanSemesterData };
        } else {
            // If it's a new semester, add it to the array.
            semesters.push(cleanSemesterData);
        }
        // Update the entire 'semesters' array field in the year document.
        await updateDoc(yearRef, { semesters: semesters });
        console.log(`[Firestore] Successfully saved semester ${semesterData.semesterCode} in year ${yearId}.`);
    } catch (error) { console.error(`[Firestore] Error saving semester in year ${yearId}:`, error); throw error; }
};

/**
 * Deletes a semester object from the 'semesters' array of a specific year document.
 * @param {string} yearId - The ID of the parent year document.
 * @param {string} semesterCodeToDelete - The code of the semester to remove.
 */
export const deleteSemesterFromYear = async (yearId, semesterCodeToDelete) => {
     if (!yearId || !semesterCodeToDelete) throw new Error("Year ID and Semester Code are required for deletion.");
     const yearRef = doc(db, 'years', yearId);
     try {
         const yearSnap = await getDoc(yearRef);
         if (!yearSnap.exists()) { console.warn(`Year ${yearId} not found for semester deletion.`); return; }
         const yearData = yearSnap.data();
         const semesters = yearData.semesters || [];
         // Create a new array containing all semesters except the one to be deleted.
         const updatedSemesters = semesters.filter(s => s.semesterCode !== semesterCodeToDelete);
         // Only perform a write operation if a semester was actually removed.
         if (updatedSemesters.length < semesters.length) await updateDoc(yearRef, { semesters: updatedSemesters });
         else console.warn(`[Firestore] Semester ${semesterCodeToDelete} not found in year ${yearId}.`);
         console.log(`[Firestore] Semester ${semesterCodeToDelete} processed for deletion from year ${yearId}.`);
     } catch (error) { console.error(`[Firestore] Error deleting semester ${semesterCodeToDelete} from year ${yearId}:`, error); throw error; }
};

// --- Functions for Nested Rooms within Sites ---
/**
 * Saves or updates a room object within the 'rooms' array of a specific site document.
 * @param {string} siteId - The ID of the parent site document.
 * @param {Object} roomData - The room data to save.
 */
export const saveRoomInSite = async (siteId, roomData) => {
    if (!siteId || !roomData?.roomCode) throw new Error("Site ID and Room Data (with roomCode) are required.");
    const siteRef = doc(db, 'sites', siteId);
    try {
        const siteSnap = await getDoc(siteRef);
        if (!siteSnap.exists()) throw new Error(`Site document ${siteId} not found.`);
        const siteData = siteSnap.data();
        const rooms = siteData.rooms || [];
        const existingIndex = rooms.findIndex(r => r.roomCode === roomData.roomCode);
        const cleanRoomData = { roomCode: roomData.roomCode, roomName: roomData.roomName || "", notes: roomData.notes || "" };
        if (existingIndex > -1) {
            rooms[existingIndex] = { ...rooms[existingIndex], ...cleanRoomData };
        } else {
            rooms.push(cleanRoomData);
        }
        await updateDoc(siteRef, { rooms: rooms });
        console.log(`[Firestore] Successfully saved room ${roomData.roomCode} in site ${siteId}.`);
    } catch (error) { console.error(`[Firestore] Error saving room in site ${siteId}:`, error); throw error; }
};

/**
 * Deletes a room object from the 'rooms' array of a specific site document.
 * @param {string} siteId - The ID of the parent site document.
 * @param {string} roomCodeToDelete - The code of the room to remove.
 */
export const deleteRoomFromSite = async (siteId, roomCodeToDelete) => {
     if (!siteId || !roomCodeToDelete) throw new Error("Site ID and Room Code are required for deletion.");
     const siteRef = doc(db, 'sites', siteId);
     try {
         const siteSnap = await getDoc(siteRef);
         if (!siteSnap.exists()) { console.warn(`Site ${siteId} not found for room deletion.`); return; }
         const siteData = siteSnap.data();
         const rooms = siteData.rooms || [];
         const updatedRooms = rooms.filter(r => r.roomCode !== roomCodeToDelete);
         if (updatedRooms.length < rooms.length) await updateDoc(siteRef, { rooms: updatedRooms });
         else console.warn(`[Firestore] Room ${roomCodeToDelete} not found in site ${siteId}.`);
         console.log(`[Firestore] Room ${roomCodeToDelete} processed for deletion from site ${siteId}.`);
     } catch (error) { console.error(`[Firestore] Error deleting room ${roomCodeToDelete} from site ${siteId}:`, error); throw error; }
};

// --- Utility Functions ---
/**
 * Fetches all rooms from all sites and returns them as a single flattened array.
 * @returns {Promise<Array>} A promise that resolves to an array of all room objects.
 */
export const fetchAllRooms = async () => {
     console.log("[Firestore] Fetching all rooms from all sites...");
     try {
         const sites = await fetchCollection('sites');
         // Use flatMap to iterate over each site and then its rooms, creating a single array of rooms.
         const allRooms = (sites || []).flatMap(site =>
             (site.rooms || []).map(room => ({ ...room, siteCode: site.siteCode, siteName: site.siteName }))
         );
         console.log(`[Firestore] Fetched a total of ${allRooms.length} rooms.`);
         return allRooms;
     } catch (error) { console.error("[Firestore] Error fetching all rooms:", error); throw error; }
 };

 /**
 * Fetches documents from a collection that match a set of query constraints.
 * @param {string} collectionName - The name of the collection.
 * @param {Array} queryConstraints - An array of query constraints, e.g., [where("courseId", "==", "some-id")].
 * @returns {Promise<Array>} A promise that resolves to an array of matching documents.
 */
export const fetchCollectionWithQuery = async (collectionName, queryConstraints = []) => {
    try {
        const collRef = collection(db, collectionName);
        // The spread operator (...) applies all provided constraints to the query.
        const q = query(collRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching collection '${collectionName}' with query:`, error);
        throw error; 
    }
};