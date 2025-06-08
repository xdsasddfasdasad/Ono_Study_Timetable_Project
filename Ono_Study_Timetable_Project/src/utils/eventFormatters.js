// src/utils/eventFormatters.js

import { format, parseISO, addDays } from 'date-fns';

// מאגר צבעים מרכזי לאירועים בלוח השנה
const EVENT_COLORS = {
  courseMeeting: '#3788d8',
  holiday: '#e3342f',
  vacation: '#f6993f',
  event: '#38c172',
  task: '#8e44ad',
  studentEvent: '#ffc107',
  default: '#6c757d',
};

/**
 * פונקציית עזר פנימית לחישוב תאריך סיום בלעדי (exclusive) עבור אירועים של יום שלם.
 * FullCalendar מצפה שתאריך הסיום של אירוע שמתפרס על כל היום יהיה היום *שאחרי* היום האחרון של האירוע.
 * @param {string} endDateString - תאריך הסיום של האירוע ('YYYY-MM-DD').
 * @returns {string | null} תאריך הסיום הבלעדי, או null אם הקלט לא תקין.
 */
const getExclusiveEndDateInternal = (endDateString) => {
  if (!endDateString || typeof endDateString !== 'string') return null;
  try {
    const endDate = parseISO(endDateString);
    if (isNaN(endDate.getTime())) return null;
    const exclusiveEnd = addDays(endDate, 1);
    return format(exclusiveEnd, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error calculating exclusive end date:", error);
    return null;
  }
};

/**
 * פונקציית עזר פנימית לעיצוב אובייקט בודד מ-Firestore לפורמט של FullCalendar.
 * @param {object} eventData - אובייקט האירוע הגולמי מ-Firestore.
 * @returns {object | null} אובייקט אירוע מעוצב, או null אם הנתונים חסרים.
 */
const formatSingleEventForCalendar = (eventData) => {
  if (!eventData || !eventData.type || !(eventData.startDate || eventData.date || eventData.submissionDate)) {
    console.warn("Skipping event formatting due to missing primary date field:", eventData);
    return null;
  }

  const { type, allDay } = eventData;

  const finalStartDate = eventData.startDate || eventData.date || eventData.submissionDate;
  const finalEndDate = eventData.endDate || finalStartDate;

  const title = eventData.eventName || eventData.holidayName || eventData.vacationName || eventData.assignmentName || eventData.courseName || 'Untitled Event';
  const id = eventData.id || eventData.eventCode || eventData.holidayCode || eventData.vacationCode || eventData.assignmentCode || `gen-${Math.random()}`;

  const formattedEvent = {
    id: id,
    title: title,
    allDay: !!allDay,
    backgroundColor: EVENT_COLORS[type] || EVENT_COLORS.default,
    borderColor: EVENT_COLORS[type] || EVENT_COLORS.default,
    extendedProps: { ...eventData },
  };

  if (allDay) {
    formattedEvent.start = finalStartDate;
    if (finalEndDate && finalEndDate >= finalStartDate) {
      formattedEvent.end = getExclusiveEndDateInternal(finalEndDate);
    }
  } else {
    // עבור משימות, השעה היא submissionHour. עבור השאר, startHour/endHour.
    const startHour = eventData.startHour || eventData.submissionHour || '00:00';
    const endHour = eventData.endHour || startHour; // אם אין שעת סיום, נניח שהאירוע נקודתי
    
    if (!startHour) return null;

    try {
      const startDateTime = new Date(`${finalStartDate}T${startHour}`);
      if (isNaN(startDateTime.getTime())) throw new Error("Invalid start date/time");
      formattedEvent.start = startDateTime;

      if (endHour) {
        const endDateTime = new Date(`${finalEndDate}T${endHour}`);
        if (isNaN(endDateTime.getTime())) throw new Error("Invalid end date/time");
        
        // רק אם שעת הסיום באמת אחרי שעת ההתחלה, נוסיף אותה
        if (endDateTime > startDateTime) {
            formattedEvent.end = endDateTime;
        }
      }
    } catch (error) {
      console.error("Could not parse date/time for event:", title, error);
      return null;
    }
  }
  
  return formattedEvent;
};

/**
 * הפונקציה הראשית והיחידה שמיוצאת.
 * מקבלת מערך של אובייקטים גולמיים מ-Firestore ומעצבת את כולם לפורמט של FullCalendar.
 * @param {Array<object>} rawEvents - מערך של אירועים כפי שהגיעו מ-Firestore.
 * @returns {Array<object>} מערך של אירועים מעוצבים ומוכנים להצגה.
 */
export const formatAllEventsForCalendar = (rawEvents = []) => {
  if (!Array.isArray(rawEvents)) return [];
  
  return rawEvents
    .map(eventData => formatSingleEventForCalendar(eventData))
    .filter(Boolean); // מסנן החוצה כל אירוע שהחזיר null.
};