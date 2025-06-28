import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from './firebaseConfig';

const storage = getStorage(app);

/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param {File} file - The file object to upload.
 * @param {string} path - The destination path in storage (e.g., 'messageAttachments/threadId').
 * @returns {Promise<{downloadURL: string, filePath: string}>} An object containing the download URL and the full path of the uploaded file.
 */
export const uploadFile = async (file, path) => {
    if (!file || !path) {
        throw new Error("File and path are required for upload.");
    }
    
    // Create a unique file name to avoid collisions
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullPath = `${path}/${uniqueFileName}`;
    const storageRef = ref(storage, fullPath);

    try {
        console.log(`[Storage] Uploading file to: ${fullPath}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`[Storage] File uploaded successfully. URL: ${downloadURL}`);
        return { downloadURL, filePath: fullPath };
    } catch (error) {
        console.error(`[Storage] Error uploading file to ${fullPath}:`, error);
        throw new Error("File upload failed.");
    }
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} filePath - The full path to the file in storage.
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
    if (!filePath) {
        console.warn("[Storage] deleteFile called with no path.");
        return;
    }
    
    const storageRef = ref(storage, filePath);

    try {
        await deleteObject(storageRef);
        console.log(`[Storage] File deleted successfully: ${filePath}`);
    } catch (error) {
        // It's common for a file not to be found, so we can handle that gracefully.
        if (error.code === 'storage/object-not-found') {
            console.warn(`[Storage] File not found for deletion, but proceeding: ${filePath}`);
        } else {
            console.error(`[Storage] Error deleting file ${filePath}:`, error);
            throw new Error("Could not delete the file.");
        }
    }
};