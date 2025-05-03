// src/utils/getStudentEvents.js

import { getRecords } from './storage';
import { formatDateTime, getExclusiveEndDate } from './eventFormatters';

let lecturersMapCache = null;
const getLecturersMap = () => {
    if (!lecturersMapCache) {
        try {
            const lecturers = getRecords("lecturers") || [];
            lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
            console.log("[Get Student Events] Created lecturers map.");
        } catch (error) {
             console.error("[Get Student Events] Error creating lecturers map:", error);
             lecturersMapCache = new Map();
        }
    }
    return lecturersMapCache;
};

const EVENT_COLORS = {
    yearMarker: '#a5d6a7', semesterMarker: '#81d4fa', };
const EVENT_BORDERS = {
    yearMarker: '#66bb6a', semesterMarker: '#29b6f6',  };
const EVENT_TEXT_COLORS = {
    yearMarker: '#1b5e20', semesterMarker: '#01579b', };


    
export const getStudentEvents = (studentId) => {
  console.log(`[Get Student Events] STARTING for student ID: ${studentId}`);
  const combinedEvents = [];
  let lecturersMap; 
  try {
    lecturersMap = getLecturersMap();
    console.log("[Get Student Events] Processing course meetings...");
    const rawCourseMeetings = getRecords("coursesMeetings") || [];
    const formattedMeetings = rawCourseMeetings.map((meeting) => {
      const start = formatDateTime(meeting.date, meeting.startHour);
      const end = formatDateTime(meeting.date, meeting.endHour);
      if (!start || !end) {
          console.warn(`[Get Student Events] Skipping meeting due to invalid date/time: ${meeting.id}`);
          return null;
      }
      const lecturerName = lecturersMap.get(meeting.lecturerId);
      const color = '#3788d8';
      return {
        id: meeting.id,
        title: `${meeting.courseName || 'Course Meeting'}`,
        start,
        end,
        allDay: false,
        color: color,
        borderColor: color,
        extendedProps: {
            ...meeting,
            type: "courseMeeting",
            recordTypeForModal: "courseMeeting",
            lecturerName: lecturerName || null,
        }
      };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedMeetings);
    console.log(`[Get Student Events] Added ${formattedMeetings.length} course meetings.`);
    console.log("[Get Student Events] Processing personal student events...");
    const allRawStudentEvents = getRecords("studentEvents") || [];
    const myRawStudentEvents = allRawStudentEvents.filter(event => event && event.studentId === studentId);
    const formattedPersonalEvents = myRawStudentEvents.map(event => {
        if (!event.eventCode || !event.startDate || !event.eventName) {
             console.warn(`[Get Student Events] Skipping personal event due to missing data:`, event);
             return null;
        }

        const isAllDay = String(event.allDay).toLowerCase() === 'true';
        let start, end;

        if (isAllDay) {
            start = event.startDate;
            end = getExclusiveEndDate(event.startDate, event.endDate);
        } else {
            start = formatDateTime(event.startDate, event.startHour);
            const endDateForTime = event.endDate || event.startDate;
            end = formatDateTime(endDateForTime, event.endHour);
             if (!end && start) {
                 try {
                     const startDateObj = new Date(start);
                     startDateObj.setHours(startDateObj.getHours() + 1); 
                     end = startDateObj.toISOString();
                     console.warn(`[Get Student Events] Personal event ${event.eventCode} missing end time, defaulting end to: ${end}`);
                 } catch { end = start; }
             }
        }
        if (!start) {
             console.warn(`[Get Student Events] Skipping personal event ${event.eventCode} due to invalid start date/time.`);
             return null;
        }
        const color = '#1aa260'; 
        return {
            id: event.eventCode,
            title: event.eventName,
            type: 'studentEvent',
            start: start,
            end: end, 
            allDay: isAllDay,
            color: color,
            borderColor: color,
            editable: true, 
            extendedProps: {
                ...event, 
                type: 'studentEvent', 
                recordTypeForModal: 'studentEvent' 
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedPersonalEvents);
    console.log(`[Get Student Events] Added ${formattedPersonalEvents.length} OWN personal events for student ${studentId}.`);
    console.log("[Get Student Events] Processing holidays...");
    const rawHolidays = getRecords("holidays") || [];
    const formattedHolidays = rawHolidays.map((holiday) => {
        if (!holiday.holidayCode || !holiday.startDate) {
            console.warn(`[Get Student Events] Skipping holiday due to missing data:`, holiday);
            return null;
        }
        const exclusiveEnd = getExclusiveEndDate(holiday.startDate, holiday.endDate);
        const color = '#ffdde6';
        const borderColor = '#ff9f89';
        const textColor = '#a34d4d';
        return {
            id: holiday.holidayCode,
            title: holiday.holidayName || 'Holiday',
            start: holiday.startDate,
            end: exclusiveEnd,
            allDay: true,
            display: 'block',
            backgroundColor: color,
            borderColor: borderColor,
            textColor: textColor,
            classNames: ['fc-event-holiday'],
            editable: false,
            extendedProps: {
                ...holiday,
                type: 'holiday',
                recordTypeForModal: 'holiday'
            }
        };
    }).filter(event => event !== null);
    combinedEvents.push(...formattedHolidays);
    console.log(`[Get Student Events] Added ${formattedHolidays.length} holidays.`);
    console.log("[Get Student Events] Processing vacations...");
    const rawVacations = getRecords("vacations") || [];
    const formattedVacations = rawVacations.map((vacation) => {
         if (!vacation.vacationCode || !vacation.startDate) {
              console.warn(`[Get Student Events] Skipping vacation due to missing data:`, vacation);
              return null;
         }
         const exclusiveEnd = getExclusiveEndDate(vacation.startDate, vacation.endDate);
         const color = '#e6f4ff';
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
             end = getExclusiveEndDate(event.startDate, event.endDate);
         } else {
             start = formatDateTime(event.startDate, event.startHour);
             const endDateForTime = event.endDate || event.startDate;
             end = formatDateTime(endDateForTime, event.endHour);
             if (!end && start) { end = start; }
         }
         if (!start) {
              console.warn(`[Get Student Events] Skipping general event ${event.eventCode} due to invalid start date/time.`);
              return null;
         }
        const color = '#8884d8';
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
    console.log("[Get Student Events] Processing year/semester markers...");
    const years = getRecords("years") || [];
    const yearSemesterMarkers = years.flatMap((year) => {
        if (!year || !year.yearCode || !year.startDate || !year.endDate) {
            console.warn("[Get Student Events] Skipping invalid year data:", year);
            return [];
        }
        const entries = [];
        const yType = 'yearMarker'; 
        const sType = 'semesterMarker'; 
        entries.push({
            id: `y-start-${year.yearCode}`, title: `Year${year.yearNumber} Start`, start: year.startDate, allDay: true,
            display: 'block', 
            backgroundColor: EVENT_COLORS[yType] || EVENT_COLORS.default,
            borderColor: EVENT_BORDERS[yType] || EVENT_BORDERS.default,
            textColor: EVENT_TEXT_COLORS[yType] || EVENT_TEXT_COLORS.default,
            classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'],
            editable: false, 
            extendedProps: { ...year, type: yType, recordTypeForModal: 'year' }
        });
           entries.push({
            id: `y-end-${year.yearCode}`, title: `Year${year.yearNumber} End`, start: year.endDate, allDay: true,
            display: 'block', 
            backgroundColor: EVENT_COLORS[yType] || EVENT_COLORS.default,
            borderColor: EVENT_BORDERS[yType] || EVENT_BORDERS.default,
            textColor: EVENT_TEXT_COLORS[yType] || EVENT_TEXT_COLORS.default,
            classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'],
            editable: false,
            extendedProps: { ...year, type: yType, recordTypeForModal: 'year' }
        });
        (year.semesters || []).forEach((semester) => {
            if (!semester || !semester.semesterCode || !semester.startDate || !semester.endDate) return;
            const semesterDataWithYear = { ...semester, yearCode: year.yearCode };
            entries.push({
                id: `s-start-${semester.semesterCode}`, title: `Semester${semester.semesterNumber}/Year${year.yearNumber} Start`, start: semester.startDate, allDay: true,
                display: 'block',
                backgroundColor: EVENT_COLORS[sType] || EVENT_COLORS.default,
                borderColor: EVENT_BORDERS[sType] || EVENT_BORDERS.default,
                textColor: EVENT_TEXT_COLORS[sType] || EVENT_TEXT_COLORS.default,
                classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                editable: false,
                extendedProps: { ...semesterDataWithYear, type: sType, recordTypeForModal: 'semester' }
            });
            entries.push({
                id: `s-end-${semester.semesterCode}`, title: `Semester${semester.semesterNumber}/Year${year.yearNumber} End`, start: semester.endDate, allDay: true,
                display: 'block',
                backgroundColor: EVENT_COLORS[sType] || EVENT_COLORS.default,
                borderColor: EVENT_BORDERS[sType] || EVENT_BORDERS.default,
                textColor: EVENT_TEXT_COLORS[sType] || EVENT_TEXT_COLORS.default,
                classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                editable: false,
                extendedProps: { ...semesterDataWithYear, type: sType, recordTypeForModal: 'semester' }
            });
        });
        return entries;
    }).filter(event => event !== null && event.start);
    combinedEvents.push(...yearSemesterMarkers);
    console.log(`[Get Student Events] Added ${yearSemesterMarkers.length} year/semester BLOCK markers.`);
    console.log("[Get Student Events] Processing tasks...");
    const rawTasks = getRecords("tasks") || [];
    const formattedTasks = rawTasks.map(task => {
        if (!task.assignmentCode || !task.submissionDate || !task.assignmentName) return null;
        const start = formatDateTime(task.submissionDate, task.submissionHour || '23:59');
        if (!start) return null;
        const color = '#ffab91';
        return {
            id: task.assignmentCode,
            title: `Due: ${task.assignmentName}`,
            start: start,
            allDay: false,
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
      console.error("[Get Student Events] OVERALL ERROR during event processing:", error);
      return [];
  }
  console.log(`[Get Student Events] FINISHED. Returning ${combinedEvents.length} total formatted events for student ${studentId}.`);
  return combinedEvents;
};