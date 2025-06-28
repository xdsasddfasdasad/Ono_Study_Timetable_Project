// src/utils/runInitialSeed.js
import { seedBaseData } from './seedBaseData';
import { seedEventsData } from './seedEventsData';
import { hasInitialSeedBeenPerformed, markInitialSeedAsPerformed } from '../firebase/firestoreService';
import { getAuth, signOut } from "firebase/auth";
import { app } from "../firebase/firebaseConfig";

const auth = getAuth(app);

// ✅ Accept setIsSeedingGlobal as a parameter
export const runAllSeedsNow = async (force = false, setIsSeedingGlobal) => {
    console.log(`[RunSeed] Attempting to run all seeds. Force mode: ${force}`);
    if (typeof setIsSeedingGlobal !== 'function') {
        console.error("[RunSeed] setIsSeedingGlobal function not provided!");
        alert("Seeding cannot proceed: internal configuration error.");
        return false;
    }

    setIsSeedingGlobal(true); // ✅ Set global seeding state to true
    let seedActuallyRan = false;

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

        console.log(`[RunSeed] Starting seed process...`);
        seedActuallyRan = true;

        await seedBaseData(true);
        console.log("[RunSeed] seedBaseData finished.");
        await seedEventsData(true);
        console.log("[RunSeed] seedEventsData finished.");
        await markInitialSeedAsPerformed();
        console.log("[RunSeed] Seeding complete and Firestore flag set.");

        if (auth.currentUser) {
            console.log(`[RunSeed] Signing out automatically logged-in user: ${auth.currentUser.email}`);
            await signOut(auth);
            console.log("[RunSeed] User signed out after seed.");
        }

        alert("Data seeding complete! Application will now reload.");
        setIsSeedingGlobal(false); // ✅ Set global seeding state to false before reload
        window.location.reload();
        return true;

    } catch (error) {
        console.error("[RunSeed] CRITICAL ERROR during seeding process:", error);
        alert(`CRITICAL ERROR during data seeding: ${error.message}.`);
        setIsSeedingGlobal(false); // ✅ Ensure flag is reset on error
        return false;
    }
};