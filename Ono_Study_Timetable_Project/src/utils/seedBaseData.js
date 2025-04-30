// src/utils/seedBaseData.js
import { dummyData } from "../data/dummyData";
import { hashPassword } from "./hash"; // Assuming hash.js exists and works
// ✅ Import saveRecords for consistent usage
import { saveRecords, getRecords } from "./storage";

// Main function to seed base data into localStorage
export const seedBaseData = async (force = false) => {
  console.log("Attempting to seed base data...");

  // --- 1. Hash and Save Students ---
  try {
    // Check if seeding is needed
    if (force || !localStorage.getItem("students")) { // Use localStorage.getItem for simple check
      const studentsToSave = await Promise.all(
        (dummyData.students || []).map(async (student) => {
          if (!student.password) {
            console.warn(`Student ${student.username || student.id} has no password to hash.`);
            return student;
          }
          try {
             const hashed = await hashPassword(student.password);
             return { ...student, password: hashed };
          } catch (hashError) {
             console.error(`Failed to hash password for student ${student.username || student.id}:`, hashError);
             // Decide how to handle - skip student, save without password, etc.
             // Returning student without hashed password for now
             return { ...student, password: null }; // Or original password if preferred, but less secure
          }
        })
      );
      // Use saveRecords for consistency
      saveRecords("students", studentsToSave);
      console.log("Seeded students (passwords hashed where possible).");
    } else {
      console.log("Students data already exists, skipping.");
    }
  } catch (error) {
    // Catch errors during the student processing/saving phase
    console.error("Error processing or saving students:", error);
  }

  // --- 2. Define and Save Other Base Entities ---
  // Explicitly list keys considered "base data" for clarity
  const baseEntityKeys = [
      "years",
      "lecturers",
      "sites",
      "courses",    // Needed for generating meetings later
      "holidays",   // Needed for generating meetings/public events
      "vacations",  // Needed for generating meetings/public events
      "events",     // General events (raw) - needed for public events
      "tasks"       // Tasks data
      // Note: "rooms" are handled separately below (derived)
      // Note: "studentEvents" are handled separately below (raw personal)
  ];

  baseEntityKeys.forEach(key => {
      try {
          if (force || !localStorage.getItem(key)) {
              // Save the corresponding data from dummyData
              saveRecords(key, dummyData[key] || []); // Use || [] as fallback
              console.log(`Seeded ${key}.`);
          } else {
              console.log(`${key} data already exists, skipping.`);
          }
      } catch (error) {
          console.error(`Error saving base entity ${key}:`, error);
      }
  });


  // --- 3. Save Raw Student Events (Separately) ---
  try {
      console.log("Checking if seeding for 'studentEvents' is needed...");
      if (force || !localStorage.getItem("studentEvents")) {
          console.log("'studentEvents' does not exist or force=true. Proceeding to seed.");
          const rawEvents = dummyData.studentEvents || [];
          console.log("Raw student events from dummyData:", rawEvents);
          // Filter to ensure events have a studentId before saving
          const validatedStudentEvents = rawEvents.filter(e => e && e.studentId);
          console.log("Validated student events (with studentId):", validatedStudentEvents);
          if (validatedStudentEvents.length !== rawEvents.length) {
              console.warn("Some dummy student events were missing studentId and were skipped during seeding.");
          }
          // Save the filtered/validated array
          saveRecords("studentEvents", validatedStudentEvents);
          console.log("Seeded raw studentEvents successfully.");
      } else {
          console.log("Raw studentEvents data already exists, skipping.");
      }
  } catch (error) {
      // Catch errors specifically during student event saving
      console.error("Error saving raw studentEvents:", error);
  }


  // --- 4. Create and Save Derived Flat Rooms Array ---
  try {
    // Check if seeding is needed for rooms
    if (force || !localStorage.getItem("rooms")) {
        const sitesData = getRecords("sites"); // Read sites from storage (should have been seeded above)
        const rooms = sitesData.flatMap(site =>
            (site.rooms || []).map(room => ({
                ...room,
                siteCode: site.siteCode, // Add reference back to site
            }))
        );
        if (rooms.length > 0) {
            saveRecords("rooms", rooms); // Use saveRecords
            console.log("Seeded flat rooms array.");
        } else {
            console.log("No rooms found in sites data to create flat array.");
        }
    } else {
        console.log("Flat rooms array already exists, skipping generation.");
    }
  } catch (error) {
    console.error("Error creating or saving flat rooms array:", error);
  }

  console.log("Base data seeding process finished.");
}; // End of seedBaseData function