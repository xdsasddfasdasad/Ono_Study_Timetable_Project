// src/firebase/authService.js

// This file serves as a dedicated service layer for all Firebase Authentication operations.
// It abstracts the raw Firebase SDK calls into clean, reusable functions that can be used
// throughout the application. This promotes a separation of concerns and makes the code easier to maintain.

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from "firebase/auth";
// Imports the configured Firebase app instance.
import { app } from './firebaseConfig';
// Imports helper functions from our dedicated Firestore service for database operations.
import { setDocument, fetchDocumentById, updateDocument as updateFirestoreDocument } from './firestoreService';

// Initialize the Firebase Auth instance.
const auth = getAuth(app);

// --- Sign In ---
// Handles the user sign-in process.
export const signInUser = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required.");
    console.log(`[AuthService:SignIn] Attempting sign in for ${email}`);
    return signInWithEmailAndPassword(auth, email, password);
};

// --- Sign Up (Creates Auth user AND Firestore profile) ---
// This is the single source of truth for creating a new user. It's a two-step process:
// 1. Create the user in the Firebase Authentication service.
// 2. Create a corresponding user profile document in the Firestore database.
// It accepts a single object for better readability and scalability.
export const signUpUser = async (studentData) => {
    // Destructure the data for clarity. `profileData` contains everything except email and password.
    const { email, password, ...profileData } = studentData;
    if (!email || !password || !profileData.firstName || !profileData.lastName || !profileData.username || !profileData.studentIdCard) {
        throw new Error("Required fields missing for sign up.");
    }

    console.log(`[AuthService:SignUp] Attempting to sign up ${email}`);
    try {
        // Step 1: Create the user in Firebase Auth.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const generatedUID = user.uid;
        console.log(`[AuthService:SignUp] Auth user created with UID: ${generatedUID}`);

        // Prepare the full profile document for Firestore.
        const userProfileData = {
            ...profileData, // Contains firstName, lastName, username, studentIdCard, phone, etc.
            uid: generatedUID,
            id: generatedUID, // Using UID as the document ID is a common and good practice for easy lookups.
            email: user.email,
            createdAt: new Date().toISOString(), // Timestamp for when the profile was created.
        };
        
        // Step 2: Use `setDocument` to create the document in the 'students' collection
        // with the user's UID as the document ID.
        await setDocument('students', generatedUID, userProfileData);
        console.log(`[AuthService:SignUp] Firestore profile created for UID: ${generatedUID}`);
        
        return userCredential;
    } catch (error) {
        console.error("[AuthService:SignUp] Error:", error.code, error.message);
        // Re-throw the error so the calling component (e.g., a modal) can catch it and display a user-friendly message.
        throw error;
    }
};

// --- Sign Out ---
// Handles the user sign-out process.
export const signOutUser = async () => {
    console.log("[AuthService:SignOut] Attempting sign out...");
    try {
        await signOut(auth);
        console.log("[AuthService:SignOut] User signed out successfully.");
        return true;
    } catch (error) { 
        console.error("[AuthService:SignOut] Error:", error); 
        throw error; 
    }
};

// --- Auth State Listener ---
// A simple wrapper around Firebase's `onAuthStateChanged` method.
// This allows other parts of the app (like AuthContext) to subscribe to auth state changes.
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// --- Get User Profile from Firestore ---
// Fetches the user's profile document from the 'students' collection in Firestore.
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    console.log(`[AuthService:GetProfile] Fetching Firestore profile for UID: ${userId}`);
    return fetchDocumentById('students', userId);
};

// --- Update User Email in Firebase Auth and Firestore ---
// This is another two-step process for updating a user's email.
export const updateUserAuthEmail = async (newEmail) => {
    // Note: This is a sensitive operation and requires the user to have logged in recently.
    if (!auth.currentUser) throw new Error("No user currently signed in to update email.");
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) throw new Error("Invalid new email format.");

    console.log(`[AuthService:UpdateEmail] Attempting to update Auth email to: ${newEmail}`);
    try {
        // Step 1: Update the email in Firebase Authentication.
        await updateEmail(auth.currentUser, newEmail);
        console.log("[AuthService:UpdateEmail] Email updated in Firebase Auth.");
        
        // Step 2: If successful, update the email in the Firestore profile to keep data consistent.
        await updateFirestoreDocument('students', auth.currentUser.uid, { email: newEmail });
        console.log("[AuthService:UpdateEmail] Email updated in Firestore profile.");
        return true;
    } catch (error) {
        console.error("[AuthService:UpdateEmail] Error updating email:", error.code, error.message);
        // Handle common errors, like needing to re-authenticate.
        if (error.code === 'auth/requires-recent-login') {
            alert("Updating email requires recent login. Please sign out and sign back in to continue.");
        }
        throw error;
    }
};

// --- Update User Password in Firebase Auth ---
// This updates the password for the *currently logged-in* user.
// An admin cannot change another user's password this way due to Firebase security rules.
export const updateUserAuthPassword = async (newPassword) => {
    // Note: This is also a sensitive operation that requires a recent login.
    if (!auth.currentUser) throw new Error("No user currently signed in to update password.");
    if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");

    console.log("[AuthService:UpdatePassword] Attempting to update Auth password...");
    try {
        await updatePassword(auth.currentUser, newPassword);
        console.log("[AuthService:UpdatePassword] Password updated successfully in Firebase Auth.");
        // Note: We DO NOT store the plain password in Firestore. Firebase Auth handles the secure hashing.
        return true;
    } catch (error) {
        console.error("[AuthService:UpdatePassword] Error updating password:", error.code, error.message);
        if (error.code === 'auth/requires-recent-login') {
            alert("Updating password requires recent login. Please sign out and sign back in to continue.");
        }
        throw error;
    }
};

// --- Re-authenticate Current User ---
// This function can be called before a sensitive operation (like updating email/password)
// if the user's session is old. It prompts the user for their current password.
export const reauthenticateUser = async (currentPassword) => {
    if (!auth.currentUser) throw new Error("No user to re-authenticate.");
    if (!currentPassword) throw new Error("Current password is required for re-authentication.");

    console.log("[AuthService:Reauth] Attempting to re-authenticate user...");
    try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        console.log("[AuthService:Reauth] User re-authenticated successfully.");
        return true;
    } catch (error) {
        console.error("[AuthService:Reauth] Re-authentication failed:", error.code, error.message);
        throw error; // A common error here is 'auth/wrong-password'.
    }
};