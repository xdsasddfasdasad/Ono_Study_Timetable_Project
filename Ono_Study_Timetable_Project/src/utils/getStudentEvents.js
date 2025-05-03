// src/utils/getStudentEvents.js

import { getRecords } from './storage';
// ✅ ייבוא הפורמטרים המשותפים
import { formatDateTime, getExclusiveEndDate } from './eventFormatters';

// Helper to create lecturer map (cached after first call)
// (נשאר זהה, אפשר לשקול להעביר אותו לקובץ utils משותף אם משתמשים בו גם במקומות אחרים כמו עמוד הניהול)
let lecturersMapCache = null;
const getLecturersMap = () => {
    if (!lecturersMapCache) {
        try {
            const lecturers = getRecords("lecturers") || [];
            lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
            console.log("[Get Student Events] Created lecturers map.");
        } catch (error) {
             console.error("[Get Student Events] Error creating lecturers map:", error);
             lecturersMapCache = new Map(); // Return empty map on error
        }
    }
    return lecturersMapCache;
};


// --- Main Function to Get Calendar Events for a Student ---
export const getStudentEvents = (studentId) => {
  console.log(`[Get Student Events] STARTING for student ID: ${studentId}`);
  const combinedEvents = []; // Final array for FullCalendar
  let lecturersMap; // Declare here, initialize in try block

  try {
    // Initialize map within the try block
    lecturersMap = getLecturersMap();

    // --- 1. Load and Format Course Meetings (Public for all) ---
    console.log("[Get Student Events] Processing course meetings...");
    const rawCourseMeetings = getRecords("coursesMeetings") || [];
    const formattedMeetings = rawCourseMeetings.map((meeting) => {
      // ✅ שימוש בפורמטר המשותף
      const start = formatDateTime(meeting.date, meeting.startHour);
      const end = formatDateTime(meeting.date, meeting.endHour);
      // Validate start/end dates were formatted correctly
      if (!start || !end) {
          console.warn(`[Get Student Events] Skipping meeting due to invalid date/time: ${meeting.id}`);
          return null;
      }

      const lecturerName = lecturersMap.get(meeting.lecturerId);
      // Define default colors or get them from a central config if needed
      const color = '#3788d8'; // Default blue for courses

      return {
        id: meeting.id, // Unique meeting ID
        title: `${meeting.courseName || 'Course Meeting'}`, // Title can be simpler here, tooltip has details
        start,
        end,
        allDay: false,
        color: color,
        borderColor: color,
        extendedProps: {
            ...meeting, // Include all raw data from the meeting record
            type: "courseMeeting", // Standardized type identifier
            recordTypeForModal: "courseMeeting", // Map to the form/modal type (adjusted name)
            lecturerName: lecturerName || null, // Add resolved name or null
        }
      };
    }).filter(event => event !== null); // Remove null entries resulting from errors
    combinedEvents.push(...formattedMeetings);
    console.log(`[Get Student Events] Added ${formattedMeetings.length} course meetings.`);

    // --- 2. Load, Filter, and Format *OWN* Student Personal Events ---
    console.log("[Get Student Events] Processing personal student events...");
    const allRawStudentEvents = getRecords("studentEvents") || [];
    // Filter ONLY events belonging to the current student
    const myRawStudentEvents = allRawStudentEvents.filter(event => event && event.studentId === studentId);

    const formattedPersonalEvents = myRawStudentEvents.map(event => {
        // Basic validation of required fields
        if (!event.eventCode || !event.startDate || !event.eventName) {
             console.warn(`[Get Student Events] Skipping personal event due to missing data:`, event);
             return null;
        }

        const isAllDay = String(event.allDay).toLowerCase() === 'true';
        let start, end;

        if (isAllDay) {
            start = event.startDate; // Start date string (YYYY-MM-DD)
            // ✅ שימוש בפורמטר המשותף
            end = getExclusiveEndDate(event.startDate, event.endDate);
        } else {
            // ✅ שימוש בפורמטר המשותף
            start = formatDateTime(event.startDate, event.startHour);
            // Ensure endDate exists; if not, use startDate. Format end time.
            const endDateForTime = event.endDate || event.startDate;
            end = formatDateTime(endDateForTime, event.endHour);
             // Fallback if end time is missing or invalid, use start time + default duration (e.g., 1 hour)
             if (!end && start) {
                 try {
                     const startDateObj = new Date(start);
                     startDateObj.setHours(startDateObj.getHours() + 1); // Default to 1 hour duration
                     end = startDateObj.toISOString(); // Convert back to ISO string
                     console.warn(`[Get Student Events] Personal event ${event.eventCode} missing end time, defaulting end to: ${end}`);
                 } catch { end = start; } // If date parsing fails, end = start
             }
        }

        // Final validation after formatting
        if (!start) {
             console.warn(`[Get Student Events] Skipping personal event ${event.eventCode} due to invalid start date/time.`);
             return null;
        }
        // Note: FullCalendar can often handle end being null for timed events, defaulting duration.
        // But providing a fallback as above is safer.

        const color = '#1aa260'; // Green for personal events

        return {
            id: event.eventCode, // Use eventCode as the unique ID
            title: event.eventName,
            type: 'studentEvent', // Used internally for identification (e.g., in click handler)
            start: start,
            end: end, // Provide the calculated end
            allDay: isAllDay,
            color: color,
            borderColor: color,
            editable: true, // Mark student's own events as potentially editable in the calendar UI context
            extendedProps: {
                ...event, // Include raw event data
                type: 'studentEvent', // Repeat type for consistency
                recordTypeForModal: 'studentEvent' // Type hint for potential future modal use
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedPersonalEvents);
    console.log(`[Get Student Events] Added ${formattedPersonalEvents.length} OWN personal events for student ${studentId}.`);


    // --- 3. Load and Format Holidays (Public) ---
    console.log("[Get Student Events] Processing holidays...");
    const rawHolidays = getRecords("holidays") || [];
    const formattedHolidays = rawHolidays.map((holiday) => {
        if (!holiday.holidayCode || !holiday.startDate) {
            console.warn(`[Get Student Events] Skipping holiday due to missing data:`, holiday);
            return null;
        }
        // ✅ שימוש בפורמטר המשותף
        const exclusiveEnd = getExclusiveEndDate(holiday.startDate, holiday.endDate);
        const color = '#ffdde6'; // Use colors consistent with Management Page if defined centrally
        const borderColor = '#ff9f89';
        const textColor = '#a34d4d';

        return {
            id: holiday.holidayCode,
            title: holiday.holidayName || 'Holiday',
            start: holiday.startDate,
            end: exclusiveEnd, // Use calculated exclusive end date
            allDay: true,
            display: 'block', // Display as block event at the top
            backgroundColor: color, // Use specific background for block events
            borderColor: borderColor,
            textColor: textColor,
            classNames: ['fc-event-holiday'], // Add a CSS class for styling potential
            editable: false, // Not editable by student
            extendedProps: {
                ...holiday,
                type: 'holiday',
                recordTypeForModal: 'holiday' // Type hint for admin modal
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedHolidays);
    console.log(`[Get Student Events] Added ${formattedHolidays.length} holidays.`);


    // --- 4. Load and Format Vacations (Public) ---
    console.log("[Get Student Events] Processing vacations...");
    const rawVacations = getRecords("vacations") || [];
    const formattedVacations = rawVacations.map((vacation) => {
         if (!vacation.vacationCode || !vacation.startDate) {
              console.warn(`[Get Student Events] Skipping vacation due to missing data:`, vacation);
              return null;
         }
         // ✅ שימוש בפורמטר המשותף
         const exclusiveEnd = getExclusiveEndDate(vacation.startDate, vacation.endDate);
         const color = '#e6f4ff'; // Consistent colors
         const borderColor = '#b3d9ff';
         const textColor = '#336a9a';

        return {
            id: vacation.vacationCode,
            title: vacation.vacationName || 'Vacation',
            start: vacation.startDate,
            end: exclusiveEnd,
            allDay: true,
            display: 'block',
            backgroundColor: color,
            borderColor: borderColor,
            textColor: textColor,
            classNames: ['fc-event-vacation'],
            editable: false,
            extendedProps: {
                ...vacation,
                type: 'vacation',
                recordTypeForModal: 'vacation'
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedVacations);
    console.log(`[Get Student Events] Added ${formattedVacations.length} vacations.`);


    // --- 5. Load and Format General Events (Public) ---
    console.log("[Get Student Events] Processing general events...");
    const rawGeneralEvents = getRecords("events") || [];
    const formattedGeneralEvents = rawGeneralEvents.map((event) => {
         if (!event.eventCode || !event.startDate || !event.eventName) {
             console.warn(`[Get Student Events] Skipping general event due to missing data:`, event);
             return null;
         }

         const isAllDay = String(event.allDay).toLowerCase() === 'true';
         let start, end;

         if (isAllDay) {
             start = event.startDate;
             // ✅ שימוש בפורמטר המשותף
             end = getExclusiveEndDate(event.startDate, event.endDate);
         } else {
             // ✅ שימוש בפורמטר המשותף
             start = formatDateTime(event.startDate, event.startHour);
             const endDateForTime = event.endDate || event.startDate;
             end = formatDateTime(endDateForTime, event.endHour);
             // Add fallback for end time if needed, similar to personal events
             if (!end && start) { end = start; } // Simple fallback: end equals start
         }

         if (!start) {
              console.warn(`[Get Student Events] Skipping general event ${event.eventCode} due to invalid start date/time.`);
              return null;
         }
        const color = '#8884d8'; // Purple for general events

        return {
            id: event.eventCode,
            title: event.eventName,
            start: start,
            end: end,
            allDay: isAllDay,
            color: color,
            borderColor: color,
            classNames: ['fc-event-general'],
            editable: false,
            extendedProps: {
                ...event,
                type: 'event',
                recordTypeForModal: 'event'
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedGeneralEvents);
    console.log(`[Get Student Events] Added ${formattedGeneralEvents.length} general events.`);


    // --- 6. Load Years and Format Year/Semester Markers (Public Background Events) ---
    console.log("[Get Student Events] Processing year/semester markers...");
    const years = getRecords("years") || [];
    const yearSemesterMarkers = years.flatMap((year) => {
        if (!year || !year.yearCode || !year.startDate || !year.endDate) return [];
        const entries = [];
        const yearColor = '#d9f7d9'; // Lighter colors for background
        const semesterColor = '#ddddff';

        // Year Markers
        entries.push({
            id: `${year.yearCode}-start-marker`, title: `Year ${year.yearNumber} Starts`,
            start: year.startDate, allDay: true, display: 'background', color: yearColor,
             classNames: ['fc-event-marker', 'fc-event-year-marker'], editable: false,
            extendedProps: { type: 'yearMarker', ...year, recordTypeForModal: 'year' } // Include year data
        });
        // Display end marker on the day *after* the actual end date for background display clarity
        const exclusiveYearEnd = getExclusiveEndDate(year.startDate, year.endDate);
         if (exclusiveYearEnd) {
             entries.push({
                  id: `${year.yearCode}-end-marker`, title: `Year ${year.yearNumber} Ends`,
                  start: exclusiveYearEnd, // Marker appears on the day *after* the year ends
                  allDay: true, display: 'background', color: yearColor,
                   classNames: ['fc-event-marker', 'fc-event-year-marker'], editable: false,
                   extendedProps: { type: 'yearMarker', ...year, recordTypeForModal: 'year' }
             });
         }


        // Semester Markers
        (year.semesters || []).forEach((semester) => {
            if (!semester || !semester.semesterCode || !semester.startDate || !semester.endDate) return;
            const semesterDataWithYear = { ...semester, yearCode: year.yearCode }; // Include yearCode

            entries.push({
                id: `${semester.semesterCode}-start-marker`, title: `Semester ${semester.semesterNumber} Starts`,
                start: semester.startDate, allDay: true, display: 'background', color: semesterColor,
                classNames: ['fc-event-marker', 'fc-event-semester-marker'], editable: false,
                 extendedProps: { type: 'semesterMarker', ...semesterDataWithYear, recordTypeForModal: 'semester' } // Include semester data + yearCode
            });
             const exclusiveSemesterEnd = getExclusiveEndDate(semester.startDate, semester.endDate);
             if(exclusiveSemesterEnd) {
                 entries.push({
                      id: `${semester.semesterCode}-end-marker`, title: `Semester ${semester.semesterNumber} Ends`,
                      start: exclusiveSemesterEnd, // Marker appears day after semester ends
                      allDay: true, display: 'background', color: semesterColor,
                      classNames: ['fc-event-marker', 'fc-event-semester-marker'], editable: false,
                      extendedProps: { type: 'semesterMarker', ...semesterDataWithYear, recordTypeForModal: 'semester' }
                 });
             }

        });
        return entries;
    }).filter(event => event !== null && event.start); // Ensure markers have a start date
    combinedEvents.push(...yearSemesterMarkers);
    console.log(`[Get Student Events] Added ${yearSemesterMarkers.length} year/semester background markers.`);

    // --- 7. Add Tasks (If needed on student calendar) ---
    // Example structure, adapt as needed
    console.log("[Get Student Events] Processing tasks...");
    const rawTasks = getRecords("tasks") || [];
    const formattedTasks = rawTasks.map(task => {
        if (!task.assignmentCode || !task.submissionDate || !task.assignmentName) return null;
        const start = formatDateTime(task.submissionDate, task.submissionHour || '23:59'); // Due time
        if (!start) return null;
        const color = '#ffab91'; // Example color for tasks
        return {
            id: task.assignmentCode,
            title: `Due: ${task.assignmentName}`,
            start: start, // Display as a timed event at the due time
            allDay: false, // Or display as allDay on the due date: allDay: true, start: task.submissionDate
            color: color,
            borderColor: color,
            classNames: ['fc-event-task'],
            editable: false,
            extendedProps: { ...task, type: 'task', recordTypeForModal: 'task'}
        }
    }).filter(Boolean);
    combinedEvents.push(...formattedTasks);
    console.log(`[Get Student Events] Added ${formattedTasks.length} tasks.`);


  } catch (error) {
      // Log the detailed error and return an empty array to prevent app crash
      console.error("[Get Student Events] OVERALL ERROR during event processing:", error);
      // Depending on requirements, you might want to throw the error
      // or return a specific error state instead of just an empty array.
      return []; // Return empty array on critical error
  }

  console.log(`[Get Student Events] FINISHED. Returning ${combinedEvents.length} total formatted events for student ${studentId}.`);
  return combinedEvents; // Return the final combined list
}; // End of getStudentEvents