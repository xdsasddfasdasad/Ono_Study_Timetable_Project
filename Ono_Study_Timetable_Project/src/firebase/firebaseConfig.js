// src/firebase/firebaseConfig.js

// This file is the entry point for initializing the Firebase SDK for the application.
// It contains the project-specific configuration keys that connect the web app
// to the correct Firebase project on the backend.

// Imports the necessary functions from the Firebase SDK.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// --- Firebase Configuration Object ---
// This object contains all the unique identifiers for your Firebase project.
// It is generated from the Firebase console when you set up a new web app.
//
// SECURITY WARNING: These keys are intended to be public and are necessary for the client-side SDK to work.
// However, it is crucial to secure your data using Firebase Security Rules (for Firestore, Storage, etc.)
// and App Check to prevent unauthorized access and abuse of your backend resources.
// Never hardcode sensitive server-side keys or credentials in client-side code.
const firebaseConfig = {
  apiKey: "AIzaSyAes_U-bm-kVmJOulOHXS6hJ7IPL7i2OWI",
  authDomain: "onostudytimetableproject.firebaseapp.com",
  projectId: "onostudytimetableproject",
  storageBucket: "onostudytimetableproject.appspot.com",
  messagingSenderId: "551611830150",
  appId: "1:551611830150:web:e6c5255d75af92ccdae607"
};

// --- Initialize Firebase Services ---

// Initializes the Firebase application with the provided configuration.
// This `app` object is the central handle for the Firebase connection.
export const app = initializeApp(firebaseConfig);

// Gets the Firestore database instance associated with the initialized app.
// This `db` object is what you will use for all Firestore database operations
// (reading, writing, updating, deleting documents).
export const db = getFirestore(app);