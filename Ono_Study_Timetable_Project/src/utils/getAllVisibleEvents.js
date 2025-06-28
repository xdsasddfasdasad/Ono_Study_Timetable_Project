// src/utils/getAllVisibleEvents.js

// This utility file is responsible for fetching all different types of event-related data from Firestore
// and transforming it into formats suitable for different parts of the application.
// It contains two main exported functions: one for the FullCalendar view and one for the AI agent.

import { fetchCollection } from '../firebase/firestoreService';
import { addDays, parseISO, format, isWithinInterval, max, min } from 'date-fns';

// A helper function to check if two date ranges overlap.
const rangesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && endA >= startB;
};

// A simple in-memory cache for the lecturers map to avoid re-fetching on every call within a session.
let lecturersMapCache = null;
const getLecturersMap = async () => {
    if (lecturersMapCache) return lecturersMapCache;
    try {
        const lecturers = await fetchCollection("lecturers");
        // Create a Map for O(1) lookups by lecturer ID.
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("Error fetching lecturers:", error);
         return new Map();
    }
};

// A helper to calculate the "exclusive" end date required by FullCalendar for all-day events.
const getExclusiveEndDate = (endDateString) => {
    if (!endDateString) return null;
    try {
        return format(addDays(parseISO(endDateString), 1), 'yyyy-MM-dd');
    } catch { return null; }
};

// A map of icons for different event types to be used in event titles.
const EVENT_ICONS = {
  courseMeeting: '📚', holiday: '🎉', vacation: '🏖️',
  event: '🗓️', task: '📌', studentEvent: '👤',
  yearMarker: '🏁', semesterMarker: '🚩'
};

/**
 * Fetches all event types and formats them specifically for the FullCalendar library.
 * This function aggregates data from many different collections.
 * @param {object|null} currentUser - The currently authenticated user object.
 * @returns {Promise<Array>} A promise that resolves to an array of event objects formatted for FullCalendar.
 */
export const getAllVisibleEvents = async (currentUser = null) => {
  const userUID = currentUser?.uid;
  console.log(`[getAllVisibleEvents] Fetching all events for FullCalendar. Personal events for UID: ${userUID || 'Guest'}`);

  try {
    // Use Promise.all to fetch all necessary data collections in parallel for performance.
    const [
      rawMeetings, rawGeneralEvents, rawHolidays, rawVacations, rawTasks,
      allRawStudentEvents, years, lecturersMap,
    ] = await Promise.all([
      fetchCollection("coursesMeetings"), fetchCollection("events"),
      fetchCollection("holidays"), fetchCollection("vacations"),
      fetchCollection("tasks"), fetchCollection("studentEvents"),
      fetchCollection("years"), getLecturersMap(),
    ]);

    const allEvents = [];
    const addEvent = (event) => {
        if (!event || !event.extendedProps?.type) return;
        allEvents.push(event);
    };

    // --- Data Transformation Section ---
    // Each of the following blocks takes the raw data from a collection and transforms it
    // into the specific object structure that FullCalendar requires.

    // Process Course Meetings
    (rawMeetings || []).forEach(m => {
      if (!m.start) return; 
      // Convert Firestore Timestamps to JS Date objects.
      const startDate = m.start.toDate ? m.start.toDate() : new Date(m.start);
      const endDate = m.end?.toDate ? m.end.toDate() : (m.end ? new Date(m.end) : null);
      if (isNaN(startDate.getTime())) return;

      addEvent({
        id: m.id,
        title: `${EVENT_ICONS.courseMeeting} ${m.title || m.courseName}`,
        start: startDate,
        end: endDate,
        allDay: false,
        backgroundColor: '#3788d8',
        borderColor: '#3788d8',
        extendedProps: { ...m, type: 'courseMeeting', lecturerName: lecturersMap.get(m.lecturerId) }
      });
    });

    // Process General Events
    (rawGeneralEvents || []).forEach(e => {
      if (!e.startDate) return;
      addEvent({
        id: e.eventCode,
        title: `${EVENT_ICONS.event} ${e.eventName}`,
        start: e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`,
        end: e.allDay ? getExclusiveEndDate(e.endDate) : (e.endHour ? `${e.endDate || e.startDate}T${e.endHour}` : undefined),
        allDay: e.allDay,
        extendedProps: { ...e, type: 'event' }
      });
    });

    // Process Holidays
    (rawHolidays || []).forEach(h => {
      if (!h.startDate) return;
      addEvent({
        id: h.holidayCode,
        title: `${EVENT_ICONS.holiday} ${h.holidayName}`,
        start: h.startDate,
        end: getExclusiveEndDate(h.endDate),
        allDay: true,
        backgroundColor: '#ffcdd2',
        borderColor: '#e57373',
        textColor: '#b71c1c',
        extendedProps: { ...h, type: 'holiday' }
      });
    });

    // Process Vacations
    (rawVacations || []).forEach(v => {
      if (!v.startDate) return;
      addEvent({
        id: v.vacationCode,
        title: `${EVENT_ICONS.vacation} ${v.vacationName}`,
        start: v.startDate,
        end: getExclusiveEndDate(v.endDate),
        allDay: true,
        backgroundColor: '#ffecb3',
        borderColor: '#ffd54f',
        textColor: '#e65100',
        extendedProps: { ...v, type: 'vacation' }
      });
    });

    // Process Tasks
    (rawTasks || []).forEach(t => {
      if (!t.submissionDate) return;
      const startTimeString = `${t.submissionDate}T${t.submissionHour || '23:59:00'}`;
      // A small hack to make the task event have a visible duration on some calendar views.
      const endTimeString = `${t.submissionDate}T${t.submissionHour?.replace('59', '59:59') || '23:59:59'}`;
      addEvent({
        id: t.assignmentCode,
        title: `${EVENT_ICONS.task} Due: ${t.assignmentName}`,
        start: startTimeString,
        end: endTimeString,
        allDay: false,
        extendedProps: { ...t, type: 'task' }
      });
    });

    // Process Personal Student Events (only for the current user).
    if (userUID) {
      (allRawStudentEvents || [])
        .filter(event => event.studentId === userUID)
        .forEach(e => {
          if (!e.startDate) return;
          addEvent({
            id: e.eventCode,
            title: `${EVENT_ICONS.studentEvent} ${e.eventName}`,
            start: e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`,
            end: e.allDay ? getExclusiveEndDate(e.endDate) : (e.endHour ? `${e.endDate || e.startDate}T${e.endHour}` : undefined),
            allDay: e.allDay,
            extendedProps: { ...e, type: 'studentEvent' }
          });
        });
    }

    // Process Year and Semester markers (start/end dates).
    (years || []).forEach(year => {
      if (year.startDate) addEvent({ id: `y-start-${year.yearCode}`, title: `${EVENT_ICONS.yearMarker} Year ${year.yearNumber} Starts`, start: year.startDate, allDay: true, display: 'block', extendedProps: { ...year, type: 'yearMarker' } });
      if (year.endDate) addEvent({ id: `y-end-${year.yearCode}`, title: `${EVENT_ICONS.yearMarker} Year ${year.yearNumber} Ends`, start: year.endDate, allDay: true, display: 'block', extendedProps: { ...year, type: 'yearMarker' } });
      (year.semesters || []).forEach(semester => {
        if (semester.startDate) addEvent({ id: `s-start-${semester.semesterCode}`, title: `${EVENT_ICONS.semesterMarker} Sem. ${semester.semesterNumber} (${year.yearNumber}) Starts`, start: semester.startDate, allDay: true, display: 'block', extendedProps: { ...semester, type: 'semesterMarker', yearCode: year.yearCode } });
        if (semester.endDate) addEvent({ id: `s-end-${semester.semesterCode}`, title: `${EVENT_ICONS.semesterMarker} Sem. ${semester.semesterNumber} (${year.yearNumber}) Ends`, start: semester.endDate, allDay: true, display: 'block', extendedProps: { ...semester, type: 'semesterMarker', yearCode: year.yearCode } });
      });
    });

    console.log(`[getAllVisibleEvents] Returning ${allEvents.length} total events for FullCalendar.`);
    return allEvents;
  
  } catch(error) {
    console.error("[getAllVisibleEvents] Critical error:", error);
    return [];
  }
};

// ==============================================================================
//  *** New Function - For the AI Agent ***
// ==============================================================================
/**
 * Fetches all event types within a specific date range and "enriches" the data
 * with additional details, formatting it specifically for the AI agent to process.
 * @param {object} currentUser - The currently authenticated user.
 * @param {string} startDate - The start of the date range (YYYY-MM-DD).
 * @param {string} endDate - The end of the date range (YYYY-MM-DD).
 * @returns {Promise<object>} An object containing the array of events or an error.
 */
export const fetchEventsForAI = async (currentUser, startDate, endDate) => {
  const userUID = currentUser?.uid;
  if (!userUID || !startDate || !endDate) {
    return { error: "User, start date, and end date are required." };
  }

  try {
    const filterInterval = { start: parseISO(startDate), end: addDays(parseISO(endDate), 1) };
    
    // Fetch all necessary raw data collections in parallel.
    const [
      rawMeetings, rawGeneralEvents, rawHolidays, rawVacations, rawTasks,
      allRawStudentEvents, lecturersMap, years, allCourses, allSites
    ] = await Promise.all([
      fetchCollection("coursesMeetings"), fetchCollection("events"),
      fetchCollection("holidays"), fetchCollection("vacations"),
      fetchCollection("tasks"), fetchCollection("studentEvents"),
      getLecturersMap(), fetchCollection("years"), fetchCollection("courses"), fetchCollection("sites")
    ]);

    // Create lookup maps for efficient data enrichment.
    const coursesMap = new Map((allCourses || []).map(c => [c.courseCode, c]));
    const roomsMap = new Map((allSites || []).flatMap(s => (s.rooms || []).map(r => [r.roomCode, { ...r, siteName: s.siteName }])));
    const AIEvents = [];
    
    // --- Data Transformation & Enrichment Section ---
    // This section filters events by the date range and enriches them with related data.

    // Process and enrich course meetings.
    (rawMeetings || []).forEach(m => {
      if (m.start?.toDate && isWithinInterval(m.start.toDate(), filterInterval)) {
        const course = coursesMap.get(m.courseCode);
        const room = roomsMap.get(m.roomCode);
        AIEvents.push({
            ...m, type: 'courseMeeting',
            start: m.start.toDate().toISOString(),
            end: m.end?.toDate ? m.end.toDate().toISOString() : m.start.toDate().toISOString(),
            title: course?.courseName || m.title, // Use the official course name if available.
            lecturerName: lecturersMap.get(m.lecturerId) || null, // Add lecturer name.
            roomName: room?.roomName, // Add room name.
            siteName: room?.siteName,   // Add site name.
        });
      }
    });

    // Process and filter general events.
    (rawGeneralEvents || []).forEach(e => {
        if (e.startDate && isWithinInterval(parseISO(e.startDate), filterInterval)) {
            AIEvents.push({
                ...e, type: 'event', title: e.eventName, allDay: e.allDay,
                start: parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour || '00:00'}`).toISOString(),
                end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate || e.startDate}T${e.endHour || '23:59'}`).toISOString() : parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour || '00:00'}`).toISOString(),
            });
        }
    });

    // Process and filter holidays and vacations.
    [...(rawHolidays || []), ...(rawVacations || [])].forEach(h => {
        if (h.startDate && h.endDate) {
          const itemStart = parseISO(h.startDate);
          const itemEnd = parseISO(h.endDate);
          // Use a special overlap check for multi-day events.
          if (rangesOverlap(itemStart, itemEnd, filterInterval.start, filterInterval.end)) {
            AIEvents.push({ ...h, type: h.holidayName ? 'holiday' : 'vacation', title: h.holidayName || h.vacationName, allDay: true, start: itemStart.toISOString(), end: itemEnd.toISOString() });
          }
        }
    });
    
    // Process and enrich tasks.
    (rawTasks || []).forEach(t => {
      if (t.submissionDate && isWithinInterval(parseISO(t.submissionDate), filterInterval)) {
        const course = coursesMap.get(t.courseCode);
        const eventStart = parseISO(`${t.submissionDate}T${t.submissionHour || '23:59'}`);
        AIEvents.push({ ...t, type: 'task', title: `Due: ${t.assignmentName}`, courseName: course?.courseName, start: eventStart.toISOString(), allDay: false });
      }
    });

    // Process and filter the current user's personal events.
    (allRawStudentEvents || []).filter(e => e.studentId === userUID).forEach(e => {
        if (e.startDate && isWithinInterval(parseISO(e.startDate), filterInterval)) {
          const eventStart = parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`);
          AIEvents.push({ ...e, type: 'studentEvent', title: e.eventName, allDay: e.allDay, start: eventStart.toISOString(), end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate || e.startDate}T${e.endHour}`).toISOString() : eventStart.toISOString() });
        }
    });
    
    // A special case for the AI: also include course *definitions* if their semester overlaps with the query range.
    // This allows the AI to answer questions like "what courses are offered this month?".
    const allSemesters = years.flatMap(y => y.semesters || []);
    const relevantSemesters = allSemesters.filter(sem => {
        const semStart = parseISO(sem.startDate);
        const semEnd = parseISO(sem.endDate);
        return rangesOverlap(semStart, semEnd, filterInterval.start, filterInterval.end);
    });
    const relevantSemesterCodes = new Set(relevantSemesters.map(s => s.semesterCode));

    (allCourses || []).forEach(course => {
        if (relevantSemesterCodes.has(course.semesterCode)) {
            AIEvents.push({
                ...course, type: 'course', title: course.courseName,
                start: relevantSemesters.find(s => s.semesterCode === course.semesterCode).startDate + "T00:00:01Z", // Set a start time for sorting purposes.
                allDay: true,
            });
        }
    });

    // Process and filter year and semester markers.
    (years || []).forEach(year => {
        if (year.startDate && isWithinInterval(parseISO(year.startDate), filterInterval)) AIEvents.push({ ...year, type: 'yearMarker', title: `Year ${year.yearNumber} Starts`, start: year.startDate + "T00:00:00Z", allDay: true });
        if (year.endDate && isWithinInterval(parseISO(year.endDate), filterInterval)) AIEvents.push({ ...year, type: 'yearMarker', title: `Year ${year.yearNumber} Ends`, start: year.endDate + "T00:00:00Z", allDay: true });
        (year.semesters || []).forEach(semester => {
            if (semester.startDate && isWithinInterval(parseISO(semester.startDate), filterInterval)) AIEvents.push({ ...semester, type: 'semesterMarker', title: `Semester ${semester.semesterNumber} (${year.yearNumber}) Starts`, start: semester.startDate + "T00:00:00Z", allDay: true });
            if (semester.endDate && isWithinInterval(parseISO(semester.endDate), filterInterval)) AIEvents.push({ ...semester, type: 'semesterMarker', title: `Semester ${semester.semesterNumber} (${year.yearNumber}) Ends`, start: semester.endDate + "T00:00:00Z", allDay: true });
        });
    });

    return { events: AIEvents };

  } catch (error) {
    console.error("[fetchEventsForAI] Critical error:", error);
    return { error: `An error occurred: ${error.message}` };
  }
};