// src/utils/storage.js

export const saveRecord = (key, newItem) => {
    const existing = JSON.parse(localStorage.getItem(key)) || [];
    localStorage.setItem(key, JSON.stringify([...existing, newItem]));
};
  
export const getRecords = (key) => {
    return JSON.parse(localStorage.getItem(key)) || [];
};
  
export const clearRecords = (key) => {
    localStorage.removeItem(key);
};

export const getCoursesFromStorage = () => {
    return JSON.parse(localStorage.getItem("courses")) || [];
};
  
export const getHoursFromStorage = () => {
    return JSON.parse(localStorage.getItem("hours")) || [];
};