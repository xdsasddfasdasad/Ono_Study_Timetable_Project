// src/utils/getStudentEvents.js
import { getRecords } from './storage';

// Helper to format date and time for FullCalendar ISO string
// (Copied here for self-containment)
const formatDateTime = (date, time) => {
  if (!date || !time || typeof time !== 'string' || !time.includes(':')) return null;
  return `${date}T${time}`;
};

// Helper to calculate exclusive end date for multi-day all-day events
const getExclusiveEndDate = (startDate, endDate) => {
    if (!endDate || !startDate || endDate < startDate) {
        return null; // Return null if end date is invalid or before start date
    }
    // If end date is same as start date, FullCalendar handles it, return null or start date
    if (endDate === startDate) {
        return null; // Recommended for FC
    }
    // If end date is after start date, calculate exclusive end
    try {
        const exclusiveEndDate = new Date(endDate + 'T00:00:00Z');
        exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);
        return exclusiveEndDate.toISOString().slice(0, 10);
    } catch (e) {
        console.error("Error calculating exclusive end date for:", startDate, endDate, e);
        return null; // Return null on error
    }
};

// --- Main Function to Get Calendar Events for a Student ---
export const getStudentEvents = (studentId) => {
  console.log(`[Get Student Events] STARTING for student ID: ${studentId}`);
  const combinedEvents = []; // Array to hold the final list for FullCalendar

  try {
    // --- 1. Load and Format Course Meetings ---
    console.log("[Get Student Events] Loading and formatting course meetings...");
    const rawCourseMeetings = getRecords("coursesMeetings") || [];
    const formattedMeetings = rawCourseMeetings.map((meeting) => {
      const startDateTime = formatDateTime(meeting.date, meeting.startHour);
      const endDateTime = formatDateTime(meeting.date, meeting.endHour);
      if (!startDateTime || !endDateTime) return null;
      return {
        id: meeting.id,
        title: meeting.courseName,
        type: "courseMeeting", // Keep type for identification
        start: startDateTime,
        end: endDateTime,
        allDay: false,
        courseCode: meeting.courseCode,
        // Add color based on course? Example:
        // color: courseColors[meeting.courseCode] || '#3788d8', // Default blue
        extendedProps: { ...meeting } // Keep original raw meeting data
      };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedMeetings);
    console.log(`[Get Student Events] Added ${formattedMeetings.length} formatted course meetings.`);

    // --- 2. Load, Filter, and Format Student Personal Events ---
    console.log("[Get Student Events] Loading, filtering, and formatting personal events...");
    const allRawStudentEvents = getRecords("studentEvents") || [];
    const myRawStudentEvents = allRawStudentEvents.filter(event => event.studentId === studentId);
    const formattedPersonalEvents = myRawStudentEvents.map(event => {
        if (!event.eventCode || !event.startDate || !event.eventName) return null;
        const isAllDay = String(event.allDay).toLowerCase() === 'true';
        const startDateTime = isAllDay ? event.startDate : formatDateTime(event.startDate, event.startHour);
        let endDateTime;
        if (isAllDay) {
            endDateTime = getExclusiveEndDate(event.startDate, event.endDate);
        } else {
            endDateTime = formatDateTime(event.endDate || event.startDate, event.endHour);
            if (!endDateTime) endDateTime = startDateTime; // Fallback
        }
        if (!startDateTime) return null;
        return {
            id: event.eventCode,
            title: event.eventName,
            type: 'studentEvent',
            studentId: event.studentId, // Keep studentId
            start: startDateTime,
            end: endDateTime, // Can be null for single all-day
            allDay: isAllDay,
            notes: event.notes || "",
            color: '#bada55', // Personal event color
            extendedProps: { ...event }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedPersonalEvents);
    console.log(`[Get Student Events] Added ${formattedPersonalEvents.length} formatted personal events.`);

    // --- 3. Load and Format Holidays ---
    console.log("[Get Student Events] Loading and formatting holidays...");
    const holidays = getRecords("holidays") || [];
    const formattedHolidays = holidays.map((h) => {
        if (!h.holidayCode || !h.startDate) return null;
        return {
            id: h.holidayCode,
            title: h.holidayName,
            type: "holiday",
            start: h.startDate,
            end: getExclusiveEndDate(h.startDate, h.endDate),
            allDay: true,
            display: 'background',
            color: '#ff9f89',
            extendedProps: { ...h }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedHolidays);
    console.log(`[Get Student Events] Added ${formattedHolidays.length} formatted holidays.`);

    // --- 4. Load and Format Vacations ---
    console.log("[Get Student Events] Loading and formatting vacations...");
    const vacations = getRecords("vacations") || [];
    const formattedVacations = vacations.map((v) => {
        if (!v.vacationCode || !v.startDate) return null;
        return {
            id: v.vacationCode,
            title: v.vacationName,
            type: "vacation",
            start: v.startDate,
            end: getExclusiveEndDate(v.startDate, v.endDate),
            allDay: true,
            display: 'background',
            color: '#d3e9ff',
            extendedProps: { ...v }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedVacations);
    console.log(`[Get Student Events] Added ${formattedVacations.length} formatted vacations.`);

    // --- 5. Load and Format General Events ---
    console.log("[Get Student Events] Loading and formatting general events...");
    const rawGeneralEvents = getRecords("events") || [];
    const formattedGeneralEvents = rawGeneralEvents.map((e) => {
        if (!e.eventCode || !e.startDate || !e.eventName) return null;
        const isAllDay = String(e.allDay).toLowerCase() === 'true';
        const startDateTime = isAllDay ? e.startDate : formatDateTime(e.startDate, e.startHour);
        let endDateTime;
         if (isAllDay) { endDateTime = getExclusiveEndDate(e.startDate, e.endDate); }
         else { endDateTime = formatDateTime(e.endDate || e.startDate, e.endHour); }
        if (!startDateTime) return null;
        return {
            id: e.eventCode, title: e.eventName, type: "event", start: startDateTime,
            end: endDateTime, allDay: isAllDay, notes: e.notes || "", extendedProps: { ...e }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedGeneralEvents);
    console.log(`[Get Student Events] Added ${formattedGeneralEvents.length} formatted general events.`);

    // --- 6. Load Years and Format Year/Semester Markers ---
    console.log("[Get Student Events] Loading and formatting year/semester markers...");
    const years = getRecords("years") || [];
    const yearSemesterMarkers = years.flatMap((year) => {
        if (!year || !year.startDate || !year.endDate) return [];
        const entries = [];
        if(year.startDate) entries.push({ id: `${year.yearCode}-start`, title: `Year ${year.yearNumber} Start`, type: "yearMarker", start: year.startDate, allDay: true, display: 'background', color: '#aaffaa', extendedProps: { yearCode: year.yearCode, date: year.startDate } });
        if(year.endDate) entries.push({ id: `${year.yearCode}-end`, title: `Year ${year.yearNumber} End`, type: "yearMarker", start: year.endDate, allDay: true, display: 'background', color: '#ffaaaa', extendedProps: { yearCode: year.yearCode, date: year.endDate } });
        (year.semesters || []).forEach((s) => {
            if (!s || !s.startDate || !s.endDate) return;
            if(s.startDate) entries.push({ id: `${s.semesterCode}-start`, title: `Semester ${s.semesterNumber} Start`, type: "semesterMarker", start: s.startDate, allDay: true, display: 'background', color: '#aaaaff', extendedProps: { ...s } });
            if(s.endDate) entries.push({ id: `${s.semesterCode}-end`, title: `Semester ${s.semesterNumber} End`, type: "semesterMarker", start: s.endDate, allDay: true, display: 'background', color: '#ffddaa', extendedProps: { ...s } });
        });
        return entries;
    }).filter(event => event !== null && event.start); // Filter invalid markers
    combinedEvents.push(...yearSemesterMarkers);
    console.log(`[Get Student Events] Added ${yearSemesterMarkers.length} year/semester markers.`);

  } catch (error) {
      console.error("[Get Student Events] OVERALL ERROR:", error);
      // In case of error, return an empty array or only partial results?
      // Returning what we have so far:
      return combinedEvents;
  }

  console.log(`[Get Student Events] FINISHED. Returning ${combinedEvents.length} total formatted events.`);
  return combinedEvents; // Return the final combined and formatted list
};