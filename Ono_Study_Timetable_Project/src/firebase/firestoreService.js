// src/firebase/firestoreService.js

// Import Firestore functions from the SDK
import {
    collection, getDocs, getDoc, doc,
    addDoc, setDoc, updateDoc, deleteDoc, writeBatch, query, where
} from "firebase/firestore";

// ✅ Import the initialized 'db' instance ONCE from your firebaseConfig
import { db } from './firebaseConfig'; // Adjust path if needed

const SEED_FLAG_COLLECTION = '_app_seed_status';
const SEED_FLAG_DOC_ID = 'initialSeedDone';

/**
 * Checks if the initial database seed has already been performed.
 * @returns {Promise<boolean>} True if seeding was already done, false otherwise.
 */
export const hasInitialSeedBeenPerformed = async () => {
    try {
        const flagDocRef = doc(db, SEED_FLAG_COLLECTION, SEED_FLAG_DOC_ID);
        const docSnap = await getDoc(flagDocRef);
        return docSnap.exists() && docSnap.data().status === true;
    } catch (error) {
        console.error("[FirestoreService] Error checking seed flag:", error);
        return false; // Assume not seeded if error occurs
    }
};

/**
 * Sets the flag indicating that the initial database seed has been performed.
 * @returns {Promise<void>}
 */
export const markInitialSeedAsPerformed = async () => {
    try {
        const flagDocRef = doc(db, SEED_FLAG_COLLECTION, SEED_FLAG_DOC_ID);
        await setDoc(flagDocRef, { status: true, timestamp: new Date().toISOString() });
        console.log("[FirestoreService] Initial seed flag set to true.");
    } catch (error) {
        console.error("[FirestoreService] Error setting seed flag:", error);
        throw error; // Propagate error
    }
};

// --- Basic CRUD Functions ---

export const fetchCollection = async (collectionPath) => {
    console.log(`[Firestore] Fetching collection: ${collectionPath}`);
    try {
        const collectionRef = collection(db, collectionPath);
        const snapshot = await getDocs(collectionRef);
        if (snapshot.empty) {
            console.log(`[Firestore] No documents found in ${collectionPath}.`);
            return [];
        }
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firestore] Fetched ${data.length} documents from ${collectionPath}.`);
        return data;
    } catch (error) {
        console.error(`[Firestore] Error fetching collection ${collectionPath}:`, error);
        throw error;
    }
};

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

export const addDocument = async (collectionPath, data) => {
    console.log(`[Firestore] Adding document to ${collectionPath}:`, data);
    try {
        const dataToAdd = { ...data };
        // Firestore generates ID, 'id' field in data might be ignored or can be explicitly removed
        // if (dataToAdd.hasOwnProperty('id')) delete dataToAdd.id;
        const collectionRef = collection(db, collectionPath);
        const docRef = await addDoc(collectionRef, dataToAdd);
        console.log(`[Firestore] Document added successfully with ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error(`[Firestore] Error adding document to ${collectionPath}:`, error);
        throw error;
    }
};

export const setDocument = async (collectionPath, documentId, data) => {
    console.log(`[Firestore] Setting document: ${collectionPath}/${documentId}`);
    if (!documentId) { throw new Error("[Firestore] Document ID is required for setDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        await setDoc(docRef, data); // Overwrites or creates
        console.log(`[Firestore] Document set successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error setting document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

export const updateDocument = async (collectionPath, documentId, data) => {
     console.log(`[Firestore] Updating document: ${collectionPath}/${documentId}`);
     if (!documentId) { throw new Error("[Firestore] Document ID is required for updateDocument."); }
    try {
        const docRef = doc(db, collectionPath, documentId);
        await updateDoc(docRef, data); // Merges data, fails if doc doesn't exist
        console.log(`[Firestore] Document updated successfully: ${collectionPath}/${documentId}`);
    } catch (error) {
        console.error(`[Firestore] Error updating document ${collectionPath}/${documentId}:`, error);
        throw error;
    }
};

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

export const performBatchWrites = async (writes) => {
     console.log(`[Firestore] Performing ${writes.length} batch writes.`);
     const batch = writeBatch(db);
     try {
          writes.forEach(writeOp => { // Renamed 'write' to 'writeOp' to avoid conflict
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
          await batch.commit();
          console.log(`[Firestore] Batch write successful.`);
          return true;
     } catch (error) {
          console.error(`[Firestore] Error performing batch writes:`, error);
          throw error;
     }
};

// --- Functions for Nested Semesters within Years ---
export const saveSemesterInYear = async (yearId, semesterData) => {
    if (!yearId || !semesterData?.semesterCode) throw new Error("Year ID and Semester Data (with semesterCode) are required.");
    const yearRef = doc(db, 'years', yearId);
    try {
        const yearSnap = await getDoc(yearRef);
        if (!yearSnap.exists()) throw new Error(`Year document ${yearId} not found.`);
        const yearData = yearSnap.data();
        const semesters = yearData.semesters || [];
        const existingIndex = semesters.findIndex(s => s.semesterCode === semesterData.semesterCode);
        const cleanSemesterData = { semesterCode: semesterData.semesterCode, semesterNumber: semesterData.semesterNumber || "", startDate: semesterData.startDate, endDate: semesterData.endDate };
        if (existingIndex > -1) semesters[existingIndex] = { ...semesters[existingIndex], ...cleanSemesterData };
        else semesters.push(cleanSemesterData);
        await updateDoc(yearRef, { semesters: semesters });
        console.log(`[Firestore] Successfully saved semester ${semesterData.semesterCode} in year ${yearId}.`);
    } catch (error) { console.error(`[Firestore] Error saving semester in year ${yearId}:`, error); throw error; }
};

export const deleteSemesterFromYear = async (yearId, semesterCodeToDelete) => {
     if (!yearId || !semesterCodeToDelete) throw new Error("Year ID and Semester Code are required for deletion.");
     const yearRef = doc(db, 'years', yearId);
     try {
         const yearSnap = await getDoc(yearRef);
         if (!yearSnap.exists()) { console.warn(`Year ${yearId} not found for semester deletion.`); return; }
         const yearData = yearSnap.data();
         const semesters = yearData.semesters || [];
         const updatedSemesters = semesters.filter(s => s.semesterCode !== semesterCodeToDelete);
         if (updatedSemesters.length < semesters.length) await updateDoc(yearRef, { semesters: updatedSemesters });
         else console.warn(`[Firestore] Semester ${semesterCodeToDelete} not found in year ${yearId}.`);
         console.log(`[Firestore] Semester ${semesterCodeToDelete} processed for deletion from year ${yearId}.`);
     } catch (error) { console.error(`[Firestore] Error deleting semester ${semesterCodeToDelete} from year ${yearId}:`, error); throw error; }
};

// --- Functions for Nested Rooms within Sites ---
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
        if (existingIndex > -1) rooms[existingIndex] = { ...rooms[existingIndex], ...cleanRoomData };
        else rooms.push(cleanRoomData);
        await updateDoc(siteRef, { rooms: rooms });
        console.log(`[Firestore] Successfully saved room ${roomData.roomCode} in site ${siteId}.`);
    } catch (error) { console.error(`[Firestore] Error saving room in site ${siteId}:`, error); throw error; }
};

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

// --- Utility Functions (Potentially moved from other utils if Firestore specific) ---
export const fetchAllRooms = async () => {
     console.log("[Firestore] Fetching all rooms from all sites...");
     try {
         const sites = await fetchCollection('sites');
         const allRooms = (sites || []).flatMap(site =>
             (site.rooms || []).map(room => ({ ...room, siteCode: site.siteCode, siteName: site.siteName }))
         );
         console.log(`[Firestore] Fetched a total of ${allRooms.length} rooms.`);
         return allRooms;
     } catch (error) { console.error("[Firestore] Error fetching all rooms:", error); throw error; }
 };

 /**
 * Fetches documents from a collection that match a specific query.
 * @param {string} collectionName - The name of the collection.
 * @param {Array} queryConstraints - An array of query constraints, e.g., [where("courseId", "==", "some-id")].
 * @returns {Promise<Array|null>} - A promise that resolves to an array of documents or null on error.
 */
export const fetchCollectionWithQuery = async (collectionName, queryConstraints = []) => {
    try {
        const collRef = collection(db, collectionName);
        const q = query(collRef, ...queryConstraints); // Apply all constraints
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching collection '${collectionName}' with query:`, error);
        // You might want to re-throw the error or handle it as needed
        throw error; 
    }
};