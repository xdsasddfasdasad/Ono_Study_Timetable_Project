// src/utils/runInitialSeed.js

// This file contains the main orchestration logic for "seeding" the Firestore database.
// Seeding is the process of populating a new, empty database with initial or dummy data.
// This is a crucial utility for developers to set up a working environment quickly for testing and demonstration.

import { seedBaseData } from './seedBaseData';
import { seedEventsData } from './seedEventsData';
// Imports the service functions for checking and setting the "seed flag".
import { hasInitialSeedBeenPerformed, markInitialSeedAsPerformed } from '../firebase/firestoreService';
// Imports Firebase Auth functions to handle user state after seeding.
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase/firebaseConfig";

// Get the Firebase Auth instance.
const auth = getAuth(app);

// This is the main exported function that orchestrates the entire seeding process.
// It accepts a `force` flag to bypass safety checks and a state setter function
// from the AuthContext to control a global "seeding in progress" state.
export const runAllSeedsNow = async (force = false, setIsSeedingGlobal) => {
    console.log(`[RunSeed] Attempting to run all seeds. Force mode: ${force}`);
    
    // A critical check to ensure the state setter function was passed correctly.
    if (typeof setIsSeedingGlobal !== 'function') {
        console.error("[RunSeed] setIsSeedingGlobal function not provided!");
        alert("Seeding cannot proceed: internal configuration error.");
        return false;
    }

    // --- Step 1: Set the global "seeding in progress" flag to TRUE. ---
    // This tells other parts of the application, like the AuthContext, to pause their
    // normal operations until the seeding process is complete.
    setIsSeedingGlobal(true);
    let seedActuallyRan = false;

    try {
        // --- Step 2: Check if the database has already been seeded. ---
        const alreadySeeded = await hasInitialSeedBeenPerformed();

        // If it's already seeded and we're not forcing it, skip the process.
        if (!force && alreadySeeded) {
            console.log("[RunSeed] Firestore flag indicates data already seeded, and 'force' is false. Skipping.");
            alert("Initial data has already been seeded. To re-seed, use a 'force' option or clear the seed flag manually in Firestore if you know what you are doing.");
            return false; // Indicate that seeding was skipped.
        }

        // --- Step 3: Confirmation Dialogs (Safety Net) ---
        // If forcing a re-seed, get explicit confirmation from the developer.
        if (alreadySeeded && force) {
            if (!window.confirm("WARNING: Seed flag indicates data exists, but 'force' is enabled. This will attempt to re-seed and might overwrite or duplicate data. Continue?")) {
                console.log("[RunSeed] User cancelled forced re-seed.");
                return false;
            }
        } else if (!alreadySeeded) {
             // For a first-time seed, inform the developer about the process.
             alert("Starting one-time database initialization (seeding). This may take a moment. Please check the console for progress and do not close or refresh the page.");
        }

        console.log(`[RunSeed] Starting seed process...`);
        seedActuallyRan = true;

        // --- Step 4: Execute the Seeding Functions ---
        // These functions will perform the batch writes to Firestore.
        await seedBaseData(true);
        console.log("[RunSeed] seedBaseData finished.");
        await seedEventsData(true);
        console.log("[RunSeed] seedEventsData finished.");
        
        // --- Step 5: Mark the Seed as Complete ---
        // This sets the flag in Firestore so the process won't run again automatically.
        await markInitialSeedAsPerformed();
        console.log("[RunSeed] Seeding complete and Firestore flag set.");

        // --- Step 6: Clean Up and Reload ---
        // Creating users during the seed process automatically logs in the last created user.
        // We sign them out to ensure a clean state.
        if (auth.currentUser) {
            console.log(`[RunSeed] Signing out automatically logged-in user: ${auth.currentUser.email}`);
            await signOut(auth);
            console.log("[RunSeed] User signed out after seed.");
        }

        alert("Data seeding complete! Application will now reload.");
        // Set the global flag back to false right before reloading the page.
        setIsSeedingGlobal(false);
        window.location.reload();
        return true;

    } catch (error) {
        // --- Error Handling ---
        console.error("[RunSeed] CRITICAL ERROR during seeding process:", error);
        alert(`CRITICAL ERROR during data seeding: ${error.message}.`);
        // Ensure the global flag is reset even if an error occurs.
        setIsSeedingGlobal(false);
        return false;
    }
};