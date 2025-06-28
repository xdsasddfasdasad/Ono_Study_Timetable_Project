// src/utils/courseMeetingGenerator.js

// This utility file contains the core logic for automatically generating and managing
// individual course meeting events based on a course definition and a semester's schedule.

import { dayMap } from "../data/dummyData"; // Imports a simple mapping of day names to numbers.
// Imports Firestore service functions and the DB instance.
import { getFirestore, collection, query, where, getDocs, writeBatch, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchCollection, fetchDocumentById } from "../firebase/firestoreService";

// A helper function to check if a given date falls within any of the blocked date ranges (holidays, vacations).
const isDateBlocked = (date, blockedRanges) => {
  if (!blockedRanges || blockedRanges.length === 0) return false;
  const dateString = date.toISOString().slice(0, 10);
  // Returns true if the date string is between the start and end of any blocked range.
  return blockedRanges.some(({ startDate, endDate }) => startDate && endDate && dateString >= startDate && dateString <= endDate);
};

// This is the main generator function. It creates an array of course meeting objects in memory.
// (Original comment: Defines and exports a function that generates course meetings based on a course definition, semester, and holiday list.)
export const generateCourseMeetings = (courseDefinition, semester, holidaysAndVacations = []) => {
  // Initializes an empty array to hold the generated meeting objects.
  const meetings = [];
  // Essential prerequisite check: ensure all necessary data exists before proceeding.
  if (!courseDefinition?.courseCode || !Array.isArray(courseDefinition.hours) || !semester?.startDate || !semester.endDate) {
    // If conditions aren't met, return an empty array as no meetings can be generated.
    return meetings;
  }
  // Use a try-catch block to handle potential errors during date processing.
  try {
    // Convert the semester's start date string into a full Date object at UTC midnight.
    const semesterStart = new Date(semester.startDate + 'T00:00:00Z');
    // Convert the semester's end date string into a full Date object at the end of the day in UTC.
    const semesterEnd = new Date(semester.endDate + 'T23:59:59Z');
    // Validate that the date conversions were successful.
    if (isNaN(semesterStart.getTime()) || isNaN(semesterEnd.getTime())) return meetings;
    
    // Initialize a date "iterator" that will loop day-by-day through the semester.
    let currentDate = new Date(semesterStart);
    // Loop through every day from the start of the semester to the end.
    while (currentDate <= semesterEnd) {
      // Format the current date to a 'YYYY-MM-DD' string for comparisons.
      const dateStr = currentDate.toISOString().slice(0, 10);
      // Get the day of the week (0 for Sunday, 1 for Monday, etc.) in UTC.
      const jsDay = currentDate.getUTCDay();
      // Find the name of the day (e.g., 'Sun', 'Mon') using the helper map.
      const weekDay = Object.keys(dayMap).find(key => dayMap[key] === jsDay);
      
      // Check two conditions: Is today a day the class occurs on, AND is it not a holiday or vacation?
      if (weekDay && !isDateBlocked(currentDate, holidaysAndVacations)) {
        // Find all the time slots for this course that match the current day of the week.
        const matchingSlots = courseDefinition.hours.filter(h => h.day === weekDay && h.start && h.end);
        
        // For each matching time slot, create a new meeting object.
        matchingSlots.forEach(slot => {
          // Create a unique, predictable ID for each meeting.
          const meetingId = `CM-${courseDefinition.courseCode}-${dateStr}-${slot.start.replace(':', '')}`;
          // --- Key Change: Create full Date objects in UTC format ---
          const startDateTime = new Date(`${dateStr}T${slot.start}:00Z`);
          const endDateTime = new Date(`${dateStr}T${slot.end}:00Z`);
          // Final validation to ensure the specific meeting times are valid.
          if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
            // Push the complete meeting object into the `meetings` array.
            meetings.push({
              id: meetingId,
              title: courseDefinition.courseName || `Meeting for ${courseDefinition.courseCode}`,
              courseCode: courseDefinition.courseCode,
              type: "courseMeeting",
              // --- Store the date fields as full Date objects instead of separate strings ---
              start: startDateTime,
              end: endDateTime,
              allDay: false,
              semesterCode: semester.semesterCode,
              lecturerId: courseDefinition.lecturerId || null,
              roomCode: courseDefinition.roomCode || null,
              notes: courseDefinition.notes || "",
              zoomMeetinglink: courseDefinition.zoomMeetinglink || "",
            });
          }
        });
      }
      // Increment the date iterator by one day to continue the loop.
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  } catch (error) { 
    // If any error occurs in the try block, log it and return an empty array.
    console.error(`[Generator] Error generating meetings for course ${courseDefinition?.courseCode}:`, error); 
    return []; 
  }
  
  // After successful generation, log how many meetings were created in memory.
  console.log(`[Generator] Generated ${meetings.length} meetings in memory for ${courseDefinition.courseCode}.`);
  
  // Return the complete array of generated course meetings.
  return meetings;
};



// --- Firestore Interaction Functions ---

/**
 * Deletes all meetings for a specific course from Firestore using a batch delete.
 * @param {string} courseCode - The code of the course whose meetings should be deleted.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
export const deleteMeetingsForCourseFirestore = async (courseCode) => {
    if (!courseCode) return false;
    console.log(`[Generator:DeleteFirestore] Deleting meetings for course ${courseCode}...`);
    const meetingsCollectionRef = collection(db, "coursesMeetings");
    // Query for all documents in 'coursesMeetings' where the courseCode matches.
    const q = query(meetingsCollectionRef, where("courseCode", "==", courseCode));
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log(`[Generator:DeleteFirestore] No existing meetings found for ${courseCode}.`);
            return true; // Nothing to delete, which is a success case.
        }
        // Create a batch write operation to delete all documents atomically.
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnapshot => {
            batch.delete(docSnapshot.ref); // Add each document's deletion to the batch.
        });
        // Commit the batch to execute all deletions at once.
        await batch.commit();
        console.log(`[Generator:DeleteFirestore] Successfully deleted ${snapshot.size} meetings for ${courseCode}.`);
        return true;
    } catch (error) {
        console.error(`[Generator:DeleteFirestore] Error deleting meetings for ${courseCode}:`, error);
        return false;
    }
};

/**
 * Regenerates and saves all meeting instances for a specific course to Firestore.
 * This function orchestrates the entire process: fetching data, generating new meetings,
 * deleting all old meetings, and saving the new ones.
 * @param {string} courseCode - The course code to regenerate.
 * @returns {Promise<boolean>} True on overall success, false on failure.
 */
export const regenerateMeetingsForCourse = async (courseCode) => {
    if (!courseCode) return false;
    console.log(`[Generator:RegenerateFirestore] Regenerating meetings for course: ${courseCode}`);
    try {
        // 1. Fetch all necessary data from Firestore (the course, years/semesters, and holidays).
        const courseDef = await fetchDocumentById("courses", courseCode);
        if (!courseDef) throw new Error(`Course definition ${courseCode} not found.`);

        const years = await fetchCollection("years");
        const semesterData = years.flatMap(y => y.semesters || []).find(s => s.semesterCode === courseDef.semesterCode);
        if (!semesterData) throw new Error(`Semester ${courseDef.semesterCode} not found.`);

        const holidays = await fetchCollection("holidays");
        const vacations = await fetchCollection("vacations");
        const blockedRanges = [...(holidays || []), ...(vacations || [])];

        // 2. Generate the new list of meeting objects in memory.
        const newMeetings = generateCourseMeetings(courseDef, semesterData, blockedRanges);

        // 3. Delete all existing meetings for this course to ensure a clean slate.
        const deleteSuccess = await deleteMeetingsForCourseFirestore(courseCode);
        if (!deleteSuccess) {
            // If the deletion fails, we stop the process to avoid creating duplicate meetings.
            throw new Error(`Failed to delete existing meetings for ${courseCode} before regenerating.`);
        }

        // 4. Write the new meetings to Firestore using a batch operation for efficiency.
        if (newMeetings.length > 0) {
            const batch = writeBatch(db);
            const meetingsCollectionRef = collection(db, "coursesMeetings");
            newMeetings.forEach(meeting => {
                // We use the predictable ID generated earlier to create the document reference.
                if (meeting.id) {
                    const docRef = doc(meetingsCollectionRef, meeting.id);
                    batch.set(docRef, meeting); // Use `set` to create/overwrite the document.
                } else {
                    console.warn("[Generator:RegenerateFirestore] Skipping meeting without ID:", meeting);
                }
            });
            await batch.commit();
            console.log(`[Generator:RegenerateFirestore] Successfully wrote ${newMeetings.length} new meetings for ${courseCode}.`);
        } else {
            console.log(`[Generator:RegenerateFirestore] No new meetings generated for ${courseCode}.`);
        }

        return true; // Return true to indicate the entire process was successful.

    } catch (error) {
        console.error(`[Generator:RegenerateFirestore] Error during regeneration for ${courseCode}:`, error);
        return false;
    }
};

// This function maintains the original name for backward compatibility but now simply
// calls the more descriptively named Firestore-specific version.
export const deleteMeetingsForCourse = async (courseCode) => {
     return deleteMeetingsForCourseFirestore(courseCode);
};