// /src/utils/eventFormatters.js

export const formatDateTime = (date, time) => {
    if (!date || !time || typeof time !== 'string' || !time.includes(':')) return null;
    // Basic check for valid date and time format parts
    if (isNaN(new Date(date).getTime()) || !/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null;
    return `${date}T${time}`;
  };
  
  export const getExclusiveEndDate = (startDate, endDate) => {
    if (!endDate || !startDate || endDate < startDate) return startDate; // Return start if invalid or single day
  
    try {
      // Important: Assume dates are YYYY-MM-DD strings. Use UTC to avoid timezone shifts.
      const exclusiveEnd = new Date(endDate + 'T00:00:00Z');
      exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
      return exclusiveEnd.toISOString().slice(0, 10); // Return YYYY-MM-DD
    } catch (e) {
      console.error("Error calculating exclusive end date:", e);
      return startDate; // Fallback
    }
  };