// src/utils/courseMeetingGenerator.js

import { dayMap } from "../data/dummyData"; // Assuming dayMap is still relevant for day string to number conversion
import { getRecords, saveRecords } from "./storage"; // To fetch holidays/vacations

// Helper function to check if a specific date falls within any blocked range (holiday/vacation)
// date: Date object (UTC)
// blockedRanges: Array of objects like { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
const isDateBlocked = (date, blockedRanges) => {
  if (!blockedRanges || blockedRanges.length === 0) return false;
  // Get the date part in YYYY-MM-DD format from the UTC date object
  const dateString = date.toISOString().slice(0, 10);
  return blockedRanges.some(({ startDate, endDate }) => {
    // Ensure range dates are valid before comparison
    if (!startDate || !endDate) return false;
    return dateString >= startDate && dateString <= endDate;
  });
};

/**
 * Generates individual course meeting instances based on a course definition and semester dates.
 *
 * @param {object} courseDefinition - The course object from 'courses' storage.
 *   Expected properties: courseCode, courseName, semesterCode, hours (array),
 *   lecturerId, roomCode, notes, zoomMeetinglink.
 * @param {object} semester - The semester object for which to generate meetings.
 *   Expected properties: semesterCode, startDate, endDate.
 * @param {array} holidaysAndVacations - Combined list of holiday and vacation objects.
 *   Expected properties: startDate, endDate.
 * @returns {array} An array of courseMeeting objects ready to be saved in 'coursesMeetings'.
 */
export const generateCourseMeetings = (courseDefinition, semester, holidaysAndVacations = []) => {
  console.log(`[Generator] Generating meetings for Course: ${courseDefinition?.courseCode} in Semester: ${semester?.semesterCode}`);
  const meetings = [];

  // --- Input Validation ---
  if (!courseDefinition || !courseDefinition.courseCode || !courseDefinition.hours || !Array.isArray(courseDefinition.hours) || courseDefinition.hours.length === 0) {
    console.error("[Generator] Invalid or incomplete courseDefinition provided:", courseDefinition);
    return []; // Return empty if essential course data is missing
  }
  if (!semester || !semester.semesterCode || !semester.startDate || !semester.endDate) {
     console.error("[Generator] Invalid or incomplete semester data provided:", semester);
     return []; // Return empty if essential semester data is missing
  }
  // Validate that the course actually belongs to this semester
  if (courseDefinition.semesterCode !== semester.semesterCode) {
      console.error(`[Generator] Mismatch: Course ${courseDefinition.courseCode} is for semester ${courseDefinition.semesterCode}, but trying to generate for ${semester.semesterCode}.`);
      return [];
  }


  try {
    // --- Date Range Setup ---
    // IMPORTANT: Work with UTC dates to avoid timezone issues when iterating days.
    // Add 'T00:00:00Z' to ensure parsing as UTC start of day.
    const semesterStart = new Date(semester.startDate + 'T00:00:00Z');
    const semesterEnd = new Date(semester.endDate + 'T00:00:00Z');

    // Check for invalid dates after parsing
    if (isNaN(semesterStart.getTime()) || isNaN(semesterEnd.getTime())) {
       console.error("[Generator] Invalid semester start or end date format:", semester.startDate, semester.endDate);
       return [];
    }
    if (semesterStart > semesterEnd) {
        console.error("[Generator] Semester start date is after end date.");
        return [];
    }

    console.log(`[Generator] Iterating from ${semesterStart.toISOString()} to ${semesterEnd.toISOString()}`);
    let meetingCounter = 0;

    // --- Iterate Through Each Day of the Semester ---
    // Clone start date to avoid modifying it in the loop
    let currentDate = new Date(semesterStart);

    while (currentDate <= semesterEnd) {
      const currentDayString = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const currentDayOfWeekUTC = currentDate.getUTCDay(); // 0 for Sunday, 1 for Monday, etc.

      // Find the string representation ('Mon', 'Tue') corresponding to the UTC day number
      const currentDayName = Object.keys(dayMap).find(key => dayMap[key] === currentDayOfWeekUTC);

      if (currentDayName) {
        // --- Check if the Course has a Slot on this Day of the Week ---
        const matchingSlots = courseDefinition.hours.filter(h => h.day === currentDayName && h.start && h.end);

        if (matchingSlots.length > 0) {
          // --- Check if the Date is Blocked (Holiday/Vacation) ---
          if (!isDateBlocked(currentDate, holidaysAndVacations)) {
            // --- Create Meeting(s) for this Date ---
            matchingSlots.forEach(slot => {
              const meetingId = `CM-${courseDefinition.courseCode}-${currentDayString}-${slot.start.replace(':', '')}`; // Generate a unique ID
              meetings.push({
                id: meetingId,
                courseCode: courseDefinition.courseCode,
                courseName: courseDefinition.courseName || "", // Ensure default value
                type: "courseMeeting", // Consistent type identifier
                // Essential meeting details
                date: currentDayString, // Store date as YYYY-MM-DD string
                startHour: slot.start,  // Store time as HH:MM string
                endHour: slot.end,    // Store time as HH:MM string
                allDay: false,          // Course meetings are timed
                // Details inherited from course definition
                semesterCode: semester.semesterCode,
                lecturerId: courseDefinition.lecturerId || null,
                roomCode: courseDefinition.roomCode || null,
                notes: courseDefinition.notes || "", // Course notes can be default meeting notes
                zoomMeetinglink: courseDefinition.zoomMeetinglink || "",
              });
              meetingCounter++;
            }); // End forEach matching slot
          } else {
            // console.log(`[Generator] Skipping ${currentDayString} for ${courseDefinition.courseCode} - Blocked date.`);
          }
        } // End if matching slot found
      } // End if currentDayName found

      // Move to the next day (UTC)
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    } // End while loop through semester dates

    console.log(`[Generator] Generated ${meetingCounter} meetings for ${courseDefinition.courseCode}.`);

  } catch (error) {
    // Catch any unexpected errors during date processing or iteration
    console.error(`[Generator] Error during meeting generation for ${courseDefinition?.courseCode}:`, error);
    return []; // Return empty array on failure
  }

  return meetings; // Return the array of generated meeting objects
};

/**
 * Regenerates meetings for a specific course, replacing existing ones.
 * Fetches necessary semester and holiday/vacation data.
 *
 * @param {string} courseCode - The code of the course to regenerate meetings for.
 * @returns {boolean} True if regeneration and saving were successful, false otherwise.
 */
export const regenerateMeetingsForCourse = (courseCode) => {
    console.log(`[Generator:Regenerate] Starting regeneration for course: ${courseCode}`);
    if (!courseCode) {
        console.error("[Generator:Regenerate] Course code is required.");
        return false;
    }

    try {
        // 1. Get the Course Definition
        const courses = getRecords("courses") || [];
        const courseDef = courses.find(c => c.courseCode === courseCode);
        if (!courseDef) {
             console.error(`[Generator:Regenerate] Course definition for ${courseCode} not found.`);
             return false;
        }

        // 2. Get the relevant Semester data
        const years = getRecords("years") || [];
        let semesterData = null;
        for (const year of years) {
             const foundSemester = (year.semesters || []).find(s => s.semesterCode === courseDef.semesterCode);
             if (foundSemester) {
                 semesterData = foundSemester;
                 break;
             }
        }
        if (!semesterData) {
             console.error(`[Generator:Regenerate] Semester data for ${courseDef.semesterCode} (course ${courseCode}) not found.`);
             return false;
        }

        // 3. Get Holidays and Vacations
        const holidays = getRecords("holidays") || [];
        const vacations = getRecords("vacations") || [];
        const blockedRanges = [...holidays, ...vacations];

        // 4. Generate the NEW meetings
        const newMeetings = generateCourseMeetings(courseDef, semesterData, blockedRanges);

        // 5. Update the 'coursesMeetings' storage
        const allMeetings = getRecords("coursesMeetings") || [];
        // Filter out ALL old meetings for this specific course
        const otherMeetings = allMeetings.filter(m => m.courseCode !== courseCode);
        // Combine other meetings with the newly generated ones
        const updatedMeetingList = [...otherMeetings, ...newMeetings];

        // 6. Save the updated list
        const success = saveRecords("coursesMeetings", updatedMeetingList);
        if (success) {
            console.log(`[Generator:Regenerate] Successfully regenerated and saved ${newMeetings.length} meetings for course ${courseCode}.`);
        } else {
            console.error(`[Generator:Regenerate] Failed to save updated meeting list for course ${courseCode}.`);
        }
        return success;

    } catch (error) {
        console.error(`[Generator:Regenerate] Error during regeneration for course ${courseCode}:`, error);
        return false;
    }
};

/**
 * Deletes all meetings associated with a specific course code.
 * @param {string} courseCode - The code of the course whose meetings should be deleted.
 * @returns {boolean} True if deletion and saving were successful, false otherwise.
 */
export const deleteMeetingsForCourse = (courseCode) => {
     console.log(`[Generator:DeleteMeetings] Deleting meetings for course: ${courseCode}`);
     if (!courseCode) {
         console.error("[Generator:DeleteMeetings] Course code is required.");
         return false;
     }
     try {
          const allMeetings = getRecords("coursesMeetings") || [];
          const meetingsToKeep = allMeetings.filter(m => m.courseCode !== courseCode);

          if (meetingsToKeep.length === allMeetings.length) {
              console.warn(`[Generator:DeleteMeetings] No meetings found for course ${courseCode}. No changes made.`);
              return true; // Considered success as the state is correct
          }

          const success = saveRecords("coursesMeetings", meetingsToKeep);
           if (success) {
               console.log(`[Generator:DeleteMeetings] Successfully deleted meetings for course ${courseCode}.`);
           } else {
               console.error(`[Generator:DeleteMeetings] Failed to save meeting list after deleting for course ${courseCode}.`);
           }
           return success;
     } catch (error) {
          console.error(`[Generator:DeleteMeetings] Error during meeting deletion for course ${courseCode}:`, error);
          return false;
     }
};