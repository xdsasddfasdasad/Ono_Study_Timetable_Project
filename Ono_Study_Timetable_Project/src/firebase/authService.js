// src/firebase/authService.js
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
import { app } from './firebaseConfig'; // Firebase app instance
import { setDocument, fetchDocumentById, updateDocument as updateFirestoreDocument } from './firestoreService'; // Firestore helpers

const auth = getAuth(app); // Firebase Auth instance

// --- Sign In ---
export const signInUser = async (email, password) => {
    if (!email || !password) throw new Error("Email and password are required.");
    console.log(`[AuthService:SignIn] Attempting sign in for ${email}`);
    return signInWithEmailAndPassword(auth, email, password);
};

// --- Sign Up (Creates Auth user AND Firestore profile) ---
// ✅ This is the single, correct version of the function.
// It accepts one object for better readability and scalability.
export const signUpUser = async (studentData) => {
    const { email, password, ...profileData } = studentData;
    if (!email || !password || !profileData.firstName || !profileData.lastName || !profileData.username || !profileData.studentIdCard) {
        throw new Error("Required fields missing for sign up.");
    }

    console.log(`[AuthService:SignUp] Attempting to sign up ${email}`);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const generatedUID = user.uid;
        console.log(`[AuthService:SignUp] Auth user created with UID: ${generatedUID}`);

        // Prepare the full profile document for Firestore
        const userProfileData = {
            ...profileData, // Contains firstName, lastName, username, studentIdCard, phone, etc.
            uid: generatedUID,
            id: generatedUID, // Using UID as the document ID is a common and good practice
            email: user.email,
            createdAt: new Date().toISOString(),
        };
        
        // Use setDocument to create the document with a specific ID (the UID)
        await setDocument('students', generatedUID, userProfileData);
        console.log(`[AuthService:SignUp] Firestore profile created for UID: ${generatedUID}`);
        
        return userCredential;
    } catch (error) {
        console.error("[AuthService:SignUp] Error:", error.code, error.message);
        // Let the caller handle the error and display a user-friendly message
        throw error;
    }
};

// --- Sign Out ---
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
export const onAuthStateChangedListener = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// --- Get User Profile from Firestore ---
export const getUserProfile = async (userId) => {
    if (!userId) return null;
    console.log(`[AuthService:GetProfile] Fetching Firestore profile for UID: ${userId}`);
    return fetchDocumentById('students', userId);
};

// --- Update User Email in Firebase Auth and Firestore ---
export const updateUserAuthEmail = async (newEmail) => {
    // Note: This operation requires the user to be recently logged in.
    if (!auth.currentUser) throw new Error("No user currently signed in to update email.");
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) throw new Error("Invalid new email format.");

    console.log(`[AuthService:UpdateEmail] Attempting to update Auth email to: ${newEmail}`);
    try {
        await updateEmail(auth.currentUser, newEmail);
        console.log("[AuthService:UpdateEmail] Email updated in Firebase Auth.");
        // After successfully updating in Auth, update it in Firestore profile
        await updateFirestoreDocument('students', auth.currentUser.uid, { email: newEmail });
        console.log("[AuthService:UpdateEmail] Email updated in Firestore profile.");
        return true;
    } catch (error) {
        console.error("[AuthService:UpdateEmail] Error updating email:", error.code, error.message);
        if (error.code === 'auth/requires-recent-login') {
            alert("Updating email requires recent login. Please sign out and sign back in to continue.");
        }
        throw error;
    }
};

// --- Update User Password in Firebase Auth ---
export const updateUserAuthPassword = async (newPassword) => {
    // Note: This operation requires the user to be recently logged in.
    // Also, this only works for the CURRENTLY LOGGED IN user. An admin cannot change another user's password this way.
    if (!auth.currentUser) throw new Error("No user currently signed in to update password.");
    if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");

    console.log("[AuthService:UpdatePassword] Attempting to update Auth password...");
    try {
        await updatePassword(auth.currentUser, newPassword);
        console.log("[AuthService:UpdatePassword] Password updated successfully in Firebase Auth.");
        // Password hash is managed by Firebase Auth; DO NOT store plain password in Firestore.
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
// This might be needed before calling updateEmail or updatePassword if the user hasn't logged in recently.
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
        throw error; // Common error: auth/wrong-password
    }
};