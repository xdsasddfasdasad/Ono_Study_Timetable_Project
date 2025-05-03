// src/utils/courseMeetingGenerator.js

import { dayMap } from "../data/dummyData";
import { getRecords, saveRecords } from "./storage";

const isDateBlocked = (date, blockedRanges) => {
  if (!blockedRanges || blockedRanges.length === 0) return false;
  const dateString = date.toISOString().slice(0, 10);
  return blockedRanges.some(({ startDate, endDate }) => {
    if (!startDate || !endDate) return false;
    return dateString >= startDate && dateString <= endDate;
  });
};

/**
 * @param {object} courseDefinition
 * @param {object} Semester
 * @param {array} holidaysAndVacations
 * @returns {array}
 */
export const generateCourseMeetings = (courseDefinition, semester, holidaysAndVacations = []) => {
  console.log(`[Generator] Generating meetings for Course: ${courseDefinition?.courseCode} in Semester: ${semester?.semesterCode}`);
  const meetings = [];
  if (!courseDefinition || !courseDefinition.courseCode || !courseDefinition.hours || !Array.isArray(courseDefinition.hours) || courseDefinition.hours.length === 0) {
    console.error("[Generator] Invalid or incomplete courseDefinition provided:", courseDefinition);
    return [];
  }
  if (!semester || !semester.semesterCode || !semester.startDate || !semester.endDate) {
     console.error("[Generator] Invalid or incomplete semester data provided:", semester);
     return [];
  }
  if (courseDefinition.semesterCode !== semester.semesterCode) {
      console.error(`[Generator] Mismatch: Course ${courseDefinition.courseCode} is for semester ${courseDefinition.semesterCode}, but trying to generate for ${semester.semesterCode}.`);
      return [];
  }
  try {
    const semesterStart = new Date(semester.startDate + 'T00:00:00Z');
    const semesterEnd = new Date(semester.endDate + 'T00:00:00Z');
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
    let currentDate = new Date(semesterStart);
    while (currentDate <= semesterEnd) {
      const currentDayString = currentDate.toISOString().slice(0, 10);
      const currentDayOfWeekUTC = currentDate.getUTCDay();
      const currentDayName = Object.keys(dayMap).find(key => dayMap[key] === currentDayOfWeekUTC);
      if (currentDayName) {
        const matchingSlots = courseDefinition.hours.filter(h => h.day === currentDayName && h.start && h.end);
        if (matchingSlots.length > 0) {
          if (!isDateBlocked(currentDate, holidaysAndVacations)) {
            matchingSlots.forEach(slot => {
              const meetingId = `CM-${courseDefinition.courseCode}-${currentDayString}-${slot.start.replace(':', '')}`;
              meetings.push({
                id: meetingId,
                courseCode: courseDefinition.courseCode,
                courseName: courseDefinition.courseName || "", 
                type: "courseMeeting",
                date: currentDayString,
                startHour: slot.start,
                endHour: slot.end,
                allDay: false,
                semesterCode: semester.semesterCode,
                lecturerId: courseDefinition.lecturerId || null,
                roomCode: courseDefinition.roomCode || null,
                notes: courseDefinition.notes || "",
                zoomMeetinglink: courseDefinition.zoomMeetinglink || "",
              });
              meetingCounter++;
            });
          } else {
          }
        }
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    console.log(`[Generator] Generated ${meetingCounter} meetings for ${courseDefinition.courseCode}.`);

  } catch (error) {
    console.error(`[Generator] Error during meeting generation for ${courseDefinition?.courseCode}:`, error);
    return []; 
  }

  return meetings;
};

/**
 * @param {string} courseCode
 * @returns {boolean}
 */
export const regenerateMeetingsForCourse = (courseCode) => {
    console.log(`[Generator:Regenerate] Starting regeneration for course: ${courseCode}`);
    if (!courseCode) {
        console.error("[Generator:Regenerate] Course code is required.");
        return false;
    }

    try {
        const courses = getRecords("courses") || [];
        const courseDef = courses.find(c => c.courseCode === courseCode);
        if (!courseDef) {
             console.error(`[Generator:Regenerate] Course definition for ${courseCode} not found.`);
             return false;
        }
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
        const holidays = getRecords("holidays") || [];
        const vacations = getRecords("vacations") || [];
        const blockedRanges = [...holidays, ...vacations];
        const newMeetings = generateCourseMeetings(courseDef, semesterData, blockedRanges);
        const allMeetings = getRecords("coursesMeetings") || [];
        const otherMeetings = allMeetings.filter(m => m.courseCode !== courseCode);
        const updatedMeetingList = [...otherMeetings, ...newMeetings];
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
 @param {string} courseCode
 @returns {boolean}
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
              return true;
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