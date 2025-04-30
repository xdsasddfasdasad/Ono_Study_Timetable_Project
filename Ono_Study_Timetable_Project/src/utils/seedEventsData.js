// src/utils/seedEventsData.js
import { dummyData, dayMap } from "../data/dummyData";
import { getRecords, saveRecords } from "./storage";

// Helper: Check if a date falls within any holiday/vacation range
const isDateInRange = (date, ranges) => {
  if (!ranges || ranges.length === 0) return false;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  return ranges.some(({ startDate, endDate }) => startDate && endDate && dateStr >= startDate && dateStr <= endDate);
};

// Helper: Generate course meetings based on definitions and semester dates
const generateCourseMeetings = (courses, semesters, holidays, vacations) => {
  console.log("[Generate Meetings] Function START");
  const meetings = [];
  if (!courses || courses.length === 0 || !semesters || semesters.length === 0) {
    console.warn("[Generate Meetings] ABORTING: Missing or empty courses/semesters data.");
    return meetings;
  }

  const holidayVacationRanges = [...(holidays || []), ...(vacations || [])];
  console.log(`[Generate Meetings] Using ${courses.length} courses, ${semesters.length} semesters, ${holidayVacationRanges.length} holiday/vacation ranges.`);

  courses.forEach((course, courseIndex) => {
    console.log(`[Generate Meetings] Processing Course #${courseIndex}: ${course.courseCode}`);
    const semester = semesters.find((s) => s.semesterCode === course.semesterCode);

    if (!semester) { /* ... log and continue ... */ console.warn(`[Generate Meetings] Course ${course.courseCode}: Semester ${semester.semesterCode} not found.`); return; }
    if (!semester.startDate || !semester.endDate) { /* ... log and continue ... */ console.warn(`[Generate Meetings] Course ${course.courseCode}: Semester ${semester.semesterCode} has invalid dates.`); return; }
    if (!Array.isArray(course.hours) || course.hours.length === 0) { /* ... log and continue ... */ console.warn(`[Generate Meetings] Course ${course.courseCode}: Missing or empty 'hours' array.`); return; }

    try {
      const start = new Date(semester.startDate + 'T00:00:00Z');
      const end = new Date(semester.endDate + 'T00:00:00Z');
      if (isNaN(start.getTime()) || isNaN(end.getTime())) { /* ... log and continue ... */ console.warn(`[Generate Meetings] Course ${course.courseCode}: Could not parse semester dates.`); return; }
      console.log(`[Generate Meetings] Course ${course.courseCode}: Iterating from ${start.toISOString()} to ${end.toISOString()}`);

      let meetingCountForCourse = 0;
      for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
        const dateStr = date.toISOString().slice(0, 10);
        const jsDay = date.getUTCDay();
        const weekDay = Object.keys(dayMap).find((k) => dayMap[k] === jsDay);
        if (!weekDay) continue;

        const matchingSlot = course.hours.find((h) => h.day === weekDay);
        if (!matchingSlot || !matchingSlot.start || !matchingSlot.end) continue;
        if (isDateInRange(dateStr, holidayVacationRanges)) continue;

        // console.log(`[Generate Meetings] Course ${course.courseCode}: CREATING MEETING for ${dateStr} at ${matchingSlot.start}`);
        meetings.push({
          id: `${course.courseCode}-${dateStr}-${matchingSlot.start}`,
          courseCode: course.courseCode, courseName: course.courseName, type: "courseMeeting",
          date: dateStr, startHour: matchingSlot.start, endHour: matchingSlot.end,
          roomCode: course.roomCode || null, lecturerId: course.lecturerId || null, semesterCode: course.semesterCode,
          notes: course.notes || "", zoomMeetinglink: course.zoomMeetinglink || "", allDay: false
        });
        meetingCountForCourse++;
      }
      console.log(`[Generate Meetings] Course ${course.courseCode}: Added ${meetingCountForCourse} meetings.`);
    } catch (error) {
      console.error(`[Generate Meetings] Error during date iteration for course ${course.courseCode}:`, error);
    }
  }); // End forEach course

  console.log(`[Generate Meetings] Function END. Returning ${meetings.length} total raw meetings.`);
  return meetings;
};

// --- Main Seeding Function - ONLY generates and saves course meetings ---
export const seedEventsData = async (force = false) => {
  console.log(`[SEED COURSE MEETINGS] STARTING. Force mode: ${force}`);

  try {
    // --- 1. Load Base Data Needed for Generation ---
    console.log("[SEED COURSE MEETINGS] Loading base data...");
    const holidays = getRecords("holidays");
    const vacations = getRecords("vacations");
    const years = getRecords("years");
    const courses = getRecords("courses");
    const semesters = (years || []).flatMap((y) => y.semesters || []);
    console.log("[SEED COURSE MEETINGS] Base data loaded.");

    // --- 2. Generate Course Meetings ---
    console.log("[SEED COURSE MEETINGS] Generating raw course meetings...");
    const generatedMeetings = generateCourseMeetings(courses, semesters, holidays, vacations);

    // --- 3. Save Raw Course Meetings ---
    console.log("[SEED COURSE MEETINGS] Checking if 'coursesMeetings' needs saving...");
    if (force || !localStorage.getItem("coursesMeetings")) {
      console.log("[SEED COURSE MEETINGS] Saving generated meetings to 'coursesMeetings'...");
      saveRecords("coursesMeetings", generatedMeetings); // שמור את מה שנוצר
      console.log(`[SEED COURSE MEETINGS] Saved ${generatedMeetings.length} meetings to 'coursesMeetings'.`);
    } else {
      console.log("[SEED COURSE MEETINGS] 'coursesMeetings' data already exists, skipping save.");
    }

    // --- REMOVED ALL LOGIC RELATED TO publicCalendarEvents ---

     // --- Optional Cleanup ---
     // If you are sure you don't need the old keys from previous attempts:
     if (localStorage.getItem("allEvents")) {
        localStorage.removeItem("allEvents");
        console.log("[SEED COURSE MEETINGS] Removed old 'allEvents' key.");
     }
      if (localStorage.getItem("publicCalendarEvents")) {
         localStorage.removeItem("publicCalendarEvents");
         console.log("[SEED COURSE MEETINGS] Removed old 'publicCalendarEvents' key.");
      }


  } catch (error) {
    console.error("[SEED COURSE MEETINGS] OVERALL ERROR:", error);
  } finally {
    console.log("[SEED COURSE MEETINGS] FINISHED.");
  }
}; // End of seedEventsData function