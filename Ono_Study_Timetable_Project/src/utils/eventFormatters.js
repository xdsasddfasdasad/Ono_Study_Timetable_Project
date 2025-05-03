// src/utils/eventFormatters.js
export const formatDateTime = (date, time) => {
  if (!date || !time || typeof time !== 'string' || !time.includes(':')) return null;
  try {
      if (isNaN(new Date(date).getTime())) return null;
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) return null;
  } catch (e) { return null; }

  return `${date}T${time}`;
};
export const getExclusiveEndDate = (startDate, endDate) => {
  if (!endDate || !startDate || endDate < startDate) {

       return null;
  }
  if (startDate === endDate) {
      return null;
  }

  try {
    const exclusiveEnd = new Date(endDate + 'T00:00:00Z');
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    return exclusiveEnd.toISOString().slice(0, 10);
  } catch (e) {
    console.error("Error calculating exclusive end date for", startDate, endDate, e);
    return null;
  }
};
