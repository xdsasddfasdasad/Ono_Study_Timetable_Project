// src/firebase/storageService.js

// This file serves as a dedicated service layer for all interactions with Firebase Storage.
// It abstracts the raw Firebase SDK calls for uploading and deleting files.

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// Imports the configured Firebase app instance.
import { app } from './firebaseConfig';

// Initialize the Firebase Storage instance, which is the entry point for all storage operations.
const storage = getStorage(app);

/**
 * Uploads a file to a specified path in Firebase Storage.
 * @param {File} file - The file object to upload.
 * @param {string} path - The destination path in storage (e.g., 'messageAttachments/threadId').
 * @returns {Promise<{downloadURL: string, filePath: string}>} An object containing the public download URL and the full path of the uploaded file.
 */
export const uploadFile = async (file, path) => {
    // Basic validation to ensure the function is called correctly.
    if (!file || !path) {
        throw new Error("File and path are required for upload.");
    }
    
    // To prevent files with the same name from overwriting each other, we create a unique filename.
    // Prepending a timestamp is a common and effective strategy.
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const fullPath = `${path}/${uniqueFileName}`;
    // Create a reference to the full path where the file will be stored.
    const storageRef = ref(storage, fullPath);

    try {
        console.log(`[Storage] Uploading file to: ${fullPath}`);
        // `uploadBytes` is the core function for uploading the file's raw data.
        const snapshot = await uploadBytes(storageRef, file);
        // After a successful upload, `getDownloadURL` retrieves the public URL needed to display or download the file.
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`[Storage] File uploaded successfully. URL: ${downloadURL}`);
        // Return both the URL and the path, as the path is needed if we ever want to delete the file.
        return { downloadURL, filePath: fullPath };
    } catch (error) {
        console.error(`[Storage] Error uploading file to ${fullPath}:`, error);
        // Re-throw a more user-friendly error to be handled by the calling component.
        throw new Error("File upload failed.");
    }
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} filePath - The full path to the file in storage (e.g., 'messageAttachments/threadId/167....-document.pdf').
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
    // Basic validation.
    if (!filePath) {
        console.warn("[Storage] deleteFile called with no path.");
        return;
    }
    
    // Create a reference to the file that needs to be deleted.
    const storageRef = ref(storage, filePath);

    try {
        // `deleteObject` is the core function for removing a file from storage.
        await deleteObject(storageRef);
        console.log(`[Storage] File deleted successfully: ${filePath}`);
    } catch (error) {
        // A common scenario is trying to delete a file that doesn't exist.
        // We can catch this specific error and handle it gracefully without crashing the application.
        if (error.code === 'storage/object-not-found') {
            console.warn(`[Storage] File not found for deletion, but proceeding: ${filePath}`);
        } else {
            // For all other errors, we log them and re-throw a generic error.
            console.error(`[Storage] Error deleting file ${filePath}:`, error);
            throw new Error("Could not delete the file.");
        }
    }
};