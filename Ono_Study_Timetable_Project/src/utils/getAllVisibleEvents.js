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
  // Use Firebase UID as the single source of truth for filtering
  const userUID = currentUser?.uid;
  console.log(`[getAllVisibleEvents] Fetching all events. Personal events for UID: ${userUID || 'Guest'}`);

  try {
    // Restore the full Promise.all call to fetch all data sources correctly
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
      // Ensure the event has a type in its extendedProps for filtering/display logic later
      if (!event.extendedProps || !event.extendedProps.type) {
          console.warn("Event is missing type in extendedProps", event);
          return;
      }
      allEvents.push(event);
    };

    // Course Meetings
    (rawMeetings || []).forEach(m => {
      if (!m.date || !m.startHour) return;
      addEvent({
        id: m.id,
        title: `${EVENT_ICONS.courseMeeting} ${m.courseName}`,
        start: `${m.date}T${m.startHour}`,
        end: m.endHour ? `${m.date}T${m.endHour}` : undefined,
        allDay: false,
        extendedProps: { ...m, type: 'courseMeeting', lecturerName: lecturersMap.get(m.lecturerId) }
      });
    });

    // General Events
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

    // Holidays (Background)
    (rawHolidays || []).forEach(h => {
      if (!h.startDate) return;
      addEvent({
        id: h.holidayCode,
        title: `${EVENT_ICONS.holiday} ${h.holidayName}`,
        start: h.startDate,
        end: getExclusiveEndDate(h.endDate),
        allDay: true,
        display: 'background',
        extendedProps: { ...h, type: 'holiday' }
      });
    });

    // Vacations (Background)
    (rawVacations || []).forEach(v => {
      if (!v.startDate) return;
      addEvent({
        id: v.vacationCode,
        title: `${EVENT_ICONS.vacation} ${v.vacationName}`,
        start: v.startDate,
        end: getExclusiveEndDate(v.endDate),
        allDay: true,
        display: 'background',
        extendedProps: { ...v, type: 'vacation' }
      });
    });

    // Tasks
    (rawTasks || []).forEach(t => {
      if (!t.submissionDate) return;
      addEvent({
        id: t.assignmentCode,
        title: `${EVENT_ICONS.task} Due: ${t.assignmentName}`,
        start: `${t.submissionDate}T${t.submissionHour || '23:59'}`,
        allDay: false,
        extendedProps: { ...t, type: 'task' }
      });
    });

    // Personal Student Events (Filter by UID)
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

    // Year & Semester Markers (Block Display)
    (years || []).forEach(year => {
      if (year.startDate) {
        addEvent({
          id: `y-start-${year.yearCode}`,
          title: `${EVENT_ICONS.yearMarker} Year ${year.yearNumber} Starts`,
          start: year.startDate,
          allDay: true,
          display: 'block',
          extendedProps: { ...year, type: 'yearMarker' }
        });
      }
      (year.semesters || []).forEach(semester => {
        if (semester.startDate) {
          addEvent({
            id: `s-start-${semester.semesterCode}`,
            title: `${EVENT_ICONS.semesterMarker} Sem. ${semester.semesterNumber} (${year.yearNumber}) Starts`,
            start: semester.startDate,
            allDay: true,
            display: 'block',
            extendedProps: { ...semester, type: 'semesterMarker', yearCode: year.yearCode }
          });
        }
      });
    });

    console.log(`[getAllVisibleEvents] Returning ${allEvents.length} total events.`);
    return allEvents;
  
  } catch(error) {
    console.error("[getAllVisibleEvents] A critical error occurred during data fetching or processing:", error);
    // In case of a failure in Promise.all or elsewhere, return an empty array to prevent app crash
    return [];
  }
};