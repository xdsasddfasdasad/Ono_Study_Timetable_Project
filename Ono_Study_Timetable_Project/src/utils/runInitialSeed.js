// src/utils/runInitialSeed.js

// Import the specific seeding functions that interact with Firestore
import { seedBaseData } from './seedBaseData'; // Assumes this is the Firestore-ready version
import { seedEventsData } from './seedEventsData'; // Assumes this is the Firestore-ready version

// Import helper functions to check and set the seed status flag in Firestore
import { hasInitialSeedBeenPerformed, markInitialSeedAsPerformed } from '../firebase/firestoreService'; // Adjust path if needed

/**
 * Orchestrates the entire initial data seeding process for the application.
 * Checks if seeding has already been done using a flag in Firestore.
 * If not, it runs seedBaseData (which includes creating Auth users and Firestore profiles)
 * and then seedEventsData (which generates course meetings).
 * Finally, it marks the seeding as complete in Firestore.
 *
 * @param {boolean} force - If true, attempts to run the seed even if the flag indicates it was done.
 *                          (Note: seedBaseData and seedEventsData might have their own internal 'force' logic
 *                          or checks for emptiness of collections).
 * @returns {Promise<boolean>} True if the seeding process was attempted and (at least partially) completed,
 *                             false if it was skipped due to the flag and not being forced, or if a critical error occurred early.
 */
export const runAllSeedsNow = async (force = false) => {
    console.log(`[RunSeed] Attempting to run all seeds. Force mode: ${force}`);

    try {
        const alreadySeeded = await hasInitialSeedBeenPerformed();

        if (!force && alreadySeeded) {
            console.log("[RunSeed] Firestore flag indicates data already seeded, and 'force' is false. Skipping.");
            alert("Initial data has already been seeded. To re-seed, use a 'force' option or clear the seed flag manually in Firestore if you know what you are doing.");
            return false; // Seeding was skipped
        }

        // Confirmation for safety, especially if forcing or if already seeded (and force is true)
        if (alreadySeeded && force) {
            if (!window.confirm("WARNING: Seed flag indicates data exists, but 'force' is enabled. This will attempt to re-seed and might overwrite or duplicate data. Continue?")) {
                console.log("[RunSeed] User cancelled forced re-seed.");
                return false;
            }
        } else if (!alreadySeeded) {
             // Initial seed prompt
             alert("Starting one-time database initialization (seeding). This may take a moment. Please check the console for progress and do not close or refresh the page.");
        }


        console.log(`[RunSeed] Starting seed process... (Force effective: ${force || !alreadySeeded})`);

        // Step 1: Seed base data (includes creating Auth users & Firestore profiles for students,
        // and other base collections like years, lecturers, courses, etc.)
        console.log("[RunSeed] Running: seedBaseData...");
        // Pass 'true' to seedBaseData to ensure it attempts to run if this function is called,
        // as the main gatekeeper is hasInitialSeedBeenPerformed.
        // seedBaseData itself might have internal checks for collection emptiness.
        await seedBaseData(true);
        console.log("[RunSeed] seedBaseData finished.");

        // Step 2: Seed event data (generates course meetings based on seeded courses and semesters)
        console.log("[RunSeed] Running: seedEventsData...");
        await seedEventsData(true);
        console.log("[RunSeed] seedEventsData finished.");

        // Step 3: Mark that the entire seeding process is complete in Firestore
        await markInitialSeedAsPerformed();
        console.log("[RunSeed] Seeding process completed and Firestore flag set to true.");
        alert("Initial data setup and seeding complete! You might need to refresh the application to see all changes if not automatically updated.");
        return true; // Seeding process was attempted and (presumably) completed

    } catch (error) {
        console.error("[RunSeed] CRITICAL ERROR during overall seeding process:", error);
        alert(`CRITICAL ERROR during data seeding: ${error.message}. Check the browser console for more details. The application data might be incomplete.`);
        return false; // Indicate seeding failed critically
    }
};