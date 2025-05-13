// src/firebase/authService.js
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth";
import { app } from './firebaseConfig'; // Assuming app is exported from firebaseConfig.js
import { setDocument, fetchDocumentById } from './firestoreService'; // To save/fetch user details from Firestore

const auth = getAuth(app);

export const signInUser = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password are required.");
    }
    return signInWithEmailAndPassword(auth, email, password);
};

// Example signup function - adjust based on required fields (firstName, lastName, etc.)
export const signUpUser = async (email, password, firstName, lastName, username, studentIdCard, phone, courseCodes, eventCodes) => {
    if (!email || !password || !firstName || !lastName || !username || !studentIdCard) {
        throw new Error("Required fields missing for sign up (Email, Password, Names, Username, Student ID Card).");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const generatedUID = user.uid;
        console.log("[AuthService:SignUp] Firebase Auth user created:", generatedUID);

        const userProfileData = {
            uid: generatedUID,
            id: generatedUID, // Using UID as the primary ID in Firestore document
            email: user.email, // Email from Auth
            firstName,
            lastName,
            username,
            studentIdCard, // The 9-digit ID from the form
            phone: phone || "", // Optional
            courseCodes: courseCodes || [],
            eventCodes: eventCodes || [],
            createdAt: new Date().toISOString(),
            // role: studentIdCard === '000000001' ? 'admin' : 'student' // Example role assignment
        };
        // Use UID as the document ID in 'students' collection
        await setDocument('students', generatedUID, userProfileData);
        console.log("[AuthService:SignUp] Firestore profile document created for UID:", generatedUID);

        return userCredential;
    } catch (error) {
        console.error("[AuthService:SignUp] Error during sign up:", error.code, error.message);
        throw error; // Re-throw for the calling component/handler
    }
};

export const signOutUser = async () => {
    console.log("[AuthService] Attempting to sign out user...");
    try {
        await signOut(auth);
        console.log("[AuthService] User signed out successfully from Firebase.");
        return true; // Indicate success
    } catch (error) {
        console.error("[AuthService] Error signing out user:", error);
        throw error; // Re-throw the error for the caller to handle if needed
    }
};

// Listener for authentication state changes
// The callback will receive the user object from Firebase Auth (or null)
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Helper function to get additional user data from Firestore
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    return fetchDocumentById('students', userId); // Fetch from 'students' collection using UID
};