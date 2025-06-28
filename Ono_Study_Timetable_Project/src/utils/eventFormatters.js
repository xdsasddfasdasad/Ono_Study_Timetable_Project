// src/utils/eventFormatters.js

// This file contains utility functions dedicated to transforming raw event data from Firestore
// into the specific object format required by the FullCalendar library. This separation of concerns
// is crucial, as it decouples our database schema from the UI library's specific needs.

import { format, parseISO, addDays } from 'date-fns';

// A centralized color map to ensure consistent coloring for different event types across the calendar.
// (Original comment: Central color repository for calendar events)
const EVENT_COLORS = {
  courseMeeting: '#3788d8', // Blue
  holiday: '#e3342f',       // Red
  vacation: '#f6993f',     // Orange
  event: '#38c172',         // Green
  task: '#8e44ad',         // Purple
  studentEvent: '#ffc107',  // Yellow
  default: '#6c757d',       // Grey
};

/**
 * An internal helper function to calculate the "exclusive" end date for all-day events.
 * FullCalendar expects the `end` property for an all-day event to be the day *after* the event's last day.
 * For example, an event on 2025-12-25 should have an end date of 2025-12-26.
 * @param {string} endDateString - The inclusive end date of the event (e.g., '2025-12-25').
 * @returns {string | null} The exclusive end date string (e.g., '2025-12-26'), or null if the input is invalid.
 */
const getExclusiveEndDateInternal = (endDateString) => {
  if (!endDateString || typeof endDateString !== 'string') return null;
  try {
    const endDate = parseISO(endDateString);
    if (isNaN(endDate.getTime())) return null; // Check for invalid date strings.
    // Add one day to the end date.
    const exclusiveEnd = addDays(endDate, 1);
    // Format it back to the required 'YYYY-MM-DD' string format.
    return format(exclusiveEnd, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error calculating exclusive end date:", error);
    return null;
  }
};

/**
 * An internal helper function that formats a single raw data object from Firestore
 * into the object structure required by FullCalendar.
 * @param {object} eventData - The raw event object from Firestore.
 * @returns {object | null} A formatted event object, or null if the essential data is missing.
 */
const formatSingleEventForCalendar = (eventData) => {
  // A guard clause to ensure the event has a type and a primary date field before proceeding.
  if (!eventData || !eventData.type || !(eventData.startDate || eventData.date || eventData.submissionDate)) {
    console.warn("Skipping event formatting due to missing primary date field:", eventData);
    return null;
  }

  const { type, allDay } = eventData;

  // This logic handles the fact that different event types might use different field names for their primary date.
  // For example, a task has a `submissionDate`, while a holiday has a `startDate`.
  const finalStartDate = eventData.startDate || eventData.date || eventData.submissionDate;
  const finalEndDate = eventData.endDate || finalStartDate; // If no end date, it's a single-day event.

  // Similarly, different event types have different title fields.
  const title = eventData.eventName || eventData.holidayName || eventData.vacationName || eventData.assignmentName || eventData.courseName || 'Untitled Event';
  // And different ID fields.
  const id = eventData.id || eventData.eventCode || eventData.holidayCode || eventData.vacationCode || eventData.assignmentCode || `gen-${Math.random()}`;

  // This is the base structure for a FullCalendar event object.
  const formattedEvent = {
    id: id,
    title: title,
    allDay: !!allDay, // Ensure `allDay` is a boolean.
    backgroundColor: EVENT_COLORS[type] || EVENT_COLORS.default,
    borderColor: EVENT_COLORS[type] || EVENT_COLORS.default,
    extendedProps: { ...eventData }, // Store the original raw data here for easy access later (e.g., in click handlers).
  };

  if (allDay) {
    // For all-day events, `start` and `end` are simple 'YYYY-MM-DD' strings.
    formattedEvent.start = finalStartDate;
    if (finalEndDate && finalEndDate >= finalStartDate) {
      // Use our helper to calculate the exclusive end date.
      formattedEvent.end = getExclusiveEndDateInternal(finalEndDate);
    }
  } else {
    // For timed events, we need to combine the date and time fields into a full Date object.
    const startHour = eventData.startHour || eventData.submissionHour || '00:00'; // Tasks use `submissionHour`.
    const endHour = eventData.endHour || startHour; // If no end hour, assume it's a point-in-time event.
    
    if (!startHour) return null; // A timed event must have a start time.

    try {
      // Create a full Date object from the date and time strings.
      const startDateTime = new Date(`${finalStartDate}T${startHour}`);
      if (isNaN(startDateTime.getTime())) throw new Error("Invalid start date/time");
      formattedEvent.start = startDateTime;

      if (endHour) {
        const endDateTime = new Date(`${finalEndDate}T${endHour}`);
        if (isNaN(endDateTime.getTime())) throw new Error("Invalid end date/time");
        
        // Only set the end time if it's actually after the start time.
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
 * The main exported function. It takes an array of raw event objects from various
 * Firestore collections and maps them all into the final format required by FullCalendar.
 * @param {Array<object>} rawEvents - An array of raw event objects from Firestore.
 * @returns {Array<object>} An array of formatted event objects ready for display.
 */
export const formatAllEventsForCalendar = (rawEvents = []) => {
  if (!Array.isArray(rawEvents)) return [];
  
  return rawEvents
    // Run each raw event object through our single-event formatter.
    .map(eventData => formatSingleEventForCalendar(eventData))
    // Filter out any events that returned `null` (due to missing or invalid data).
    .filter(Boolean);
};