// src/utils/eventFormatters.js

// Helper to format YYYY-MM-DD and HH:MM into ISO-like string T connector
export const formatDateTime = (date, time) => {
  if (!date || !time || typeof time !== 'string' || !time.includes(':')) return null;
  // Basic check for valid date and time format parts
  // Consider more robust validation if needed
  try {
      // Check if date string is valid
      if (isNaN(new Date(date).getTime())) return null;
      // Check if time string looks like HH:MM or HH:MM:SS
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null;
  } catch (e) { return null; } // Catch potential Date constructor errors

  return `${date}T${time}`; // Combine with 'T'
};

// Helper to calculate the exclusive end date for multi-day all-day events for FullCalendar
// Example: start=2023-10-26, end=2023-10-27 => returns 2023-10-28
export const getExclusiveEndDate = (startDate, endDate) => {
  // If no end date, or end is before start, it's effectively a single day event from FC perspective
  if (!endDate || !startDate || endDate < startDate) {
       // For single day event, FC just needs the start date. Return null or startDate.
       // Returning null might be cleaner for FC's 'end' property interpretation.
       // Let's return null for clarity that no explicit end date *range* is needed.
       return null;
       // If you always want an end date string, uncomment below:
       // return startDate;
  }
   // If start and end are the same, it's a single day.
  if (startDate === endDate) {
      return null; // Or return startDate if needed by specific FC view
  }

  try {
    // Create Date object assuming YYYY-MM-DD input, treat as UTC
    const exclusiveEnd = new Date(endDate + 'T00:00:00Z');
    // Add one day UTC
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    // Return date part in YYYY-MM-DD format
    return exclusiveEnd.toISOString().slice(0, 10);
  } catch (e) {
    console.error("Error calculating exclusive end date for", startDate, endDate, e);
    return null; // Return null on error
  }
};

// Optional: Add other formatting helpers here if needed in the future