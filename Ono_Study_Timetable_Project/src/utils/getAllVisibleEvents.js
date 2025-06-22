// src/utils/getAllVisibleEvents.js

import { fetchCollection } from '../firebase/firestoreService';
import { addDays, parseISO, format } from 'date-fns';

let lecturersMapCache = null;
const getLecturersMap = async () => {
    if (lecturersMapCache) return lecturersMapCache;
    try {
        const lecturers = await fetchCollection("lecturers");
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("Error fetching lecturers:", error);
         return new Map();
    }
};

const getExclusiveEndDate = (endDateString) => {
    if (!endDateString) return null;
    try {
        return format(addDays(parseISO(endDateString), 1), 'yyyy-MM-dd');
    } catch { return null; }
};

const EVENT_ICONS = {
  courseMeeting: '📚', holiday: '🎉', vacation: '🏖️',
  event: '🗓️', task: '📌', studentEvent: '👤',
  yearMarker: '🏁', semesterMarker: '🚩'
};

export const getAllVisibleEvents = async (currentUser = null) => {
  const userUID = currentUser?.uid;
  console.log(`[getAllVisibleEvents] Fetching all events for FullCalendar. Personal events for UID: ${userUID || 'Guest'}`);

  try {
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

    (rawMeetings || []).forEach(m => {
      if (!m.start) return; 
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

    (rawTasks || []).forEach(t => {
      if (!t.submissionDate) return;
      const startTimeString = `${t.submissionDate}T${t.submissionHour || '23:59:00'}`;
      const endTimeString = `${t.submissionDate}T${t.submissionHour?.replace('59', '59:59') || '23:59:59'}`;      addEvent({
        id: t.assignmentCode,
        title: `${EVENT_ICONS.task} Due: ${t.assignmentName}`,
        start: startTimeString,
        end: endTimeString,
        allDay: false,
        extendedProps: { ...t, type: 'task' }
      });
    });

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

    (years || []).forEach(year => {
      if (year.startDate) {
        addEvent({ id: `y-start-${year.yearCode}`, title: `${EVENT_ICONS.yearMarker} Year ${year.yearNumber} Starts`, start: year.startDate, allDay: true, display: 'block', extendedProps: { ...year, type: 'yearMarker' } });
      }
      if (year.endDate) {
        addEvent({ id: `y-end-${year.yearCode}`, title: `${EVENT_ICONS.yearMarker} Year ${year.yearNumber} Ends`, start: year.endDate, allDay: true, display: 'block', extendedProps: { ...year, type: 'yearMarker' } });
      }
      (year.semesters || []).forEach(semester => {
        if (semester.startDate) {
          addEvent({ id: `s-start-${semester.semesterCode}`, title: `${EVENT_ICONS.semesterMarker} Sem. ${semester.semesterNumber} (${year.yearNumber}) Starts`, start: semester.startDate, allDay: true, display: 'block', extendedProps: { ...semester, type: 'semesterMarker', yearCode: year.yearCode } });
        }
        if (semester.endDate) {
          addEvent({ id: `s-end-${semester.semesterCode}`, title: `${EVENT_ICONS.semesterMarker} Sem. ${semester.semesterNumber} (${year.yearNumber}) Ends`, start: semester.endDate, allDay: true, display: 'block', extendedProps: { ...semester, type: 'semesterMarker', yearCode: year.yearCode } });
        }
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
//  *** פונקציה חדשה - עבור סוכן ה-AI ***
// ==============================================================================
export const fetchEventsForAI = async (currentUser, startDate, endDate) => {
  const userUID = currentUser?.uid;
  if (!userUID || !startDate || !endDate) {
    console.error("[fetchEventsForAI] Missing required parameters: currentUser, startDate, or endDate.");
    return { error: "User, start date, and end date are required." };
  }

  console.log(`[fetchEventsForAI] Fetching events for AI. UID: ${userUID}, Range: ${startDate} to ${endDate}`);

  try {
    const filterInterval = {
        start: parseISO(startDate),
        // הוספת יום אחד לטווח כדי לכלול את כל היום האחרון
        end: addDays(parseISO(endDate), 1) 
    };

    // 1. Fetch all potentially relevant data
    const [
      rawMeetings, rawGeneralEvents, rawHolidays, rawVacations, rawTasks,
      allRawStudentEvents, lecturersMap,
    ] = await Promise.all([
      fetchCollection("coursesMeetings"), fetchCollection("events"),
      fetchCollection("holidays"), fetchCollection("vacations"),
      fetchCollection("tasks"), fetchCollection("studentEvents"),
      getLecturersMap(),
    ]);

    const AIEvents = [];

    // 2. Process and filter each type of event
    
    // Course Meetings
    (rawMeetings || []).forEach(m => {
      if (!m.start?.toDate) return;
      const eventStart = m.start.toDate();
      if (isWithinInterval(eventStart, filterInterval)) {
        AIEvents.push({
          type: 'שיעור', // "Course Meeting"
          title: m.title || m.courseName,
          start: eventStart.toISOString(),
          end: m.end?.toDate ? m.end.toDate().toISOString() : eventStart.toISOString(),
          details: `מרצה: ${lecturersMap.get(m.lecturerId) || 'לא ידוע'}. קוד קורס: ${m.courseCode}`
        });
      }
    });

    // General Events
    (rawGeneralEvents || []).forEach(e => {
        if (!e.startDate) return;
        const eventStart = parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`);
        if (isWithinInterval(eventStart, filterInterval)) {
            AIEvents.push({
                type: 'אירוע מערכת', // "General Event"
                title: e.eventName,
                start: eventStart.toISOString(),
                end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate}T${e.endHour}`).toISOString() : eventStart.toISOString(),
                details: e.notes || `אירוע של יום שלם: ${e.allDay ? 'כן' : 'לא'}`
            });
        }
    });

    // Holidays and Vacations
    [...rawHolidays, ...rawVacations].forEach(h => {
        if (!h.startDate || !h.endDate) return;
        const holidayInterval = { start: parseISO(h.startDate), end: addDays(parseISO(h.endDate), 1) };
        // Check if the holiday interval overlaps with the filter interval
        if (max([filterInterval.start, holidayInterval.start]) < min([filterInterval.end, holidayInterval.end])) {
            AIEvents.push({
                type: h.holidayName ? 'חג' : 'חופשה', // "Holiday" or "Vacation"
                title: h.holidayName || h.vacationName,
                start: holidayInterval.start.toISOString(),
                end: parseISO(h.endDate).toISOString(),
                details: h.notes || `נמשך כל היום.`
            });
        }
    });
    
    // Tasks
    (rawTasks || []).forEach(t => {
      if (!t.submissionDate) return;
      const eventStart = parseISO(`${t.submissionDate}T${t.submissionHour || '23:59'}`);
      const startTimeString = `${t.submissionDate}T${t.submissionHour || '23:59:00'}`;
      const endTimeString = `${t.submissionDate}T${t.submissionHour?.replace('59', '59:59') || '23:59:59'}`;
      if (isWithinInterval(eventStart, filterInterval)) {
        AIEvents.push({
          type: 'מטלה להגשה', // "Task"
          title: t.assignmentName,
          start: startTimeString.toISOString(),
          end: endTimeString.toISOString(),
          details: `קורס: ${t.courseCode}. ${t.notes || 'אין הערות נוספות.'}`
        });
      }
    });

    // Personal Student Events (Filter by UID)
    (allRawStudentEvents || [])
      .filter(event => event.studentId === userUID)
      .forEach(e => {
        if (!e.startDate) return;
        const eventStart = parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`);
        if (isWithinInterval(eventStart, filterInterval)) {
          AIEvents.push({
            type: 'אירוע אישי', // "Personal Event"
            title: e.eventName,
            start: eventStart.toISOString(),
            end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate}T${e.endHour}`).toISOString() : eventStart.toISOString(),
            details: e.notes || `אירוע של יום שלם: ${e.allDay ? 'כן' : 'לא'}`
          });
        }
      });

    console.log(`[fetchEventsForAI] Returning ${AIEvents.length} events for the specified range.`);
    return { events: AIEvents }; // החזרת אובייקט עם המפתח 'events' כפי שהגדרנו במטפל

  } catch (error) {
    console.error("[fetchEventsForAI] Critical error:", error);
    return { error: `An error occurred while fetching events: ${error.message}` };
  }
};