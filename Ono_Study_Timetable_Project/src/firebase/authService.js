// src/firebase/authService.js
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile // If you want to set displayName during signup
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
export const signUpUser = async (email, password, firstName, lastName, username, /* other fields */) => {
    if (!email || !password || !firstName || !lastName || !username) {
        throw new Error("Required fields missing for sign up.");
    }
    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Firebase Auth user created:", user.uid);

        // 2. (Optional) Update Firebase Auth profile (e.g., displayName)
        // await updateProfile(user, { displayName: `${firstName} ${lastName}` });

        // 3. Create corresponding user document in Firestore 'students' collection
        // Use the Firebase Auth UID as the document ID in Firestore
        const userData = {
            id: user.uid, // Use Firebase UID as the document ID
            uid: user.uid, // Store UID also as a field if needed
            email: user.email,
            firstName: firstName,
            lastName: lastName,
            username: username,
            // Add other fields like phone, courseCodes, roles etc.
            createdAt: new Date().toISOString(), // Track creation time
            // DO NOT store password here
        };
        await setDocument('students', user.uid, userData); // Use setDoc with UID
        console.log("User document created in Firestore for:", user.uid);

        return userCredential; // Return the full credential
    } catch (error) {
        console.error("Error during sign up:", error.code, error.message);
        // Handle specific errors like 'auth/email-already-in-use'
        throw error; // Re-throw for the calling component to handle
    }
};

export const signOutUser = async () => {
    return signOut(auth);
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