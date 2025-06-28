// src/utils/getAllVisibleEvents.js

import { fetchCollection } from '../firebase/firestoreService';
import { addDays, parseISO, format, isWithinInterval, max, min } from 'date-fns';

const rangesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && endA >= startB;
};

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
    return { error: "User, start date, and end date are required." };
  }

  try {
    const filterInterval = { start: parseISO(startDate), end: addDays(parseISO(endDate), 1) };
    
    const [
      rawMeetings, rawGeneralEvents, rawHolidays, rawVacations, rawTasks,
      allRawStudentEvents, lecturersMap, years, allCourses, allSites
    ] = await Promise.all([
      fetchCollection("coursesMeetings"), fetchCollection("events"),
      fetchCollection("holidays"), fetchCollection("vacations"),
      fetchCollection("tasks"), fetchCollection("studentEvents"),
      getLecturersMap(), fetchCollection("years"), fetchCollection("courses"), fetchCollection("sites")
    ]);

    const coursesMap = new Map((allCourses || []).map(c => [c.courseCode, c]));
    const roomsMap = new Map((allSites || []).flatMap(s => (s.rooms || []).map(r => [r.roomCode, { ...r, siteName: s.siteName }])));
    const AIEvents = [];
    
    (rawMeetings || []).forEach(m => {
      if (m.start?.toDate && isWithinInterval(m.start.toDate(), filterInterval)) {
        const course = coursesMap.get(m.courseCode);
        const room = roomsMap.get(m.roomCode);
        AIEvents.push({
            ...m, type: 'courseMeeting',
            start: m.start.toDate().toISOString(),
            end: m.end?.toDate ? m.end.toDate().toISOString() : m.start.toDate().toISOString(),
            title: course?.courseName || m.title,
            lecturerName: lecturersMap.get(m.lecturerId) || null,
            roomName: room?.roomName,
            siteName: room?.siteName,
        });
      }
    });

    (rawGeneralEvents || []).forEach(e => {
        if (e.startDate && isWithinInterval(parseISO(e.startDate), filterInterval)) {
            AIEvents.push({
                ...e, type: 'event', title: e.eventName, allDay: e.allDay,
                start: parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour || '00:00'}`).toISOString(),
                end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate || e.startDate}T${e.endHour || '23:59'}`).toISOString() : parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour || '00:00'}`).toISOString(),
            });
        }
    });

    [...(rawHolidays || []), ...(rawVacations || [])].forEach(h => {
        if (h.startDate && h.endDate) {
          const itemStart = parseISO(h.startDate);
          const itemEnd = parseISO(h.endDate);
          if (rangesOverlap(itemStart, itemEnd, filterInterval.start, filterInterval.end)) {
            AIEvents.push({ ...h, type: h.holidayName ? 'holiday' : 'vacation', title: h.holidayName || h.vacationName, allDay: true, start: itemStart.toISOString(), end: itemEnd.toISOString() });
          }
        }
    });
    
    (rawTasks || []).forEach(t => {
      if (t.submissionDate && isWithinInterval(parseISO(t.submissionDate), filterInterval)) {
        const course = coursesMap.get(t.courseCode);
        const eventStart = parseISO(`${t.submissionDate}T${t.submissionHour || '23:59'}`);
        AIEvents.push({ ...t, type: 'task', title: `Due: ${t.assignmentName}`, courseName: course?.courseName, start: eventStart.toISOString(), allDay: false });
      }
    });

    (allRawStudentEvents || []).filter(e => e.studentId === userUID).forEach(e => {
        if (e.startDate && isWithinInterval(parseISO(e.startDate), filterInterval)) {
          const eventStart = parseISO(e.allDay ? e.startDate : `${e.startDate}T${e.startHour}`);
          AIEvents.push({ ...e, type: 'studentEvent', title: e.eventName, allDay: e.allDay, start: eventStart.toISOString(), end: e.endDate ? parseISO(e.allDay ? e.endDate : `${e.endDate || e.startDate}T${e.endHour}`).toISOString() : eventStart.toISOString() });
        }
    });
    
    // ✨ FIX: Add course definitions whose semester overlaps with the date range
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
                start: relevantSemesters.find(s => s.semesterCode === course.semesterCode).startDate + "T00:00:01Z", // For sorting
                allDay: true,
            });
        }
    });

    (years || []).forEach(year => {
        if (year.startDate && isWithinInterval(parseISO(year.startDate), filterInterval)) {
            AIEvents.push({ ...year, type: 'yearMarker', title: `Year ${year.yearNumber} Starts`, start: year.startDate + "T00:00:00Z", allDay: true });
        }
        if (year.endDate && isWithinInterval(parseISO(year.endDate), filterInterval)) {
            AIEvents.push({ ...year, type: 'yearMarker', title: `Year ${year.yearNumber} Ends`, start: year.endDate + "T00:00:00Z", allDay: true });
        }
        (year.semesters || []).forEach(semester => {
            if (semester.startDate && isWithinInterval(parseISO(semester.startDate), filterInterval)) {
                AIEvents.push({ ...semester, type: 'semesterMarker', title: `Semester ${semester.semesterNumber} (${year.yearNumber}) Starts`, start: semester.startDate + "T00:00:00Z", allDay: true });
            }
            if (semester.endDate && isWithinInterval(parseISO(semester.endDate), filterInterval)) {
                AIEvents.push({ ...semester, type: 'semesterMarker', title: `Semester ${semester.semesterNumber} (${year.yearNumber}) Ends`, start: semester.endDate + "T00:00:00Z", allDay: true });
            }
        });
    });

    return { events: AIEvents };

  } catch (error) {
    console.error("[fetchEventsForAI] Critical error:", error);
    return { error: `An error occurred: ${error.message}` };
  }
};