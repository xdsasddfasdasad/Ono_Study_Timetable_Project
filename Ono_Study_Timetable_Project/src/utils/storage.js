// src/utils/storage.js

// Save a single record
export const saveRecord = (key, newItem) => {
    try {
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      localStorage.setItem(key, JSON.stringify([...existing, newItem]));
      return true;
    } catch (error) {
      console.error(`Failed to save record to ${key}:`, error);
      return false;
    }
  };
  
  // Replace all records
  export const saveRecords = (key, items) => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error(`Failed to save records to ${key}:`, error);
      return false;
    }
  };
  
  // Get all records
  export const getRecords = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
      console.error(`Failed to get records from ${key}:`, error);
      return [];
    }
  };
  
  // Clear all records under a key
  export const clearRecords = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to clear records from ${key}:`, error);
      return false;
    }
  };
  
  // Update a record by matchKey
  export const updateRecord = (key, matchKey, updatedItem) => {
    try {
      const records = JSON.parse(localStorage.getItem(key)) || [];
      const updatedRecords = records.map((item) =>
        item[matchKey] === updatedItem[matchKey] ? updatedItem : item
      );
      localStorage.setItem(key, JSON.stringify(updatedRecords));
      return true;
    } catch (error) {
      console.error(`Failed to update record in ${key}:`, error);
      return false;
    }
  };
  
  // Delete a record by matchKey
  export const deleteRecord = (key, matchKey, matchValue) => {
    try {
      const records = JSON.parse(localStorage.getItem(key)) || [];
      const updatedRecords = records.filter((item) => item[matchKey] !== matchValue);
      localStorage.setItem(key, JSON.stringify(updatedRecords));
      return true;
    } catch (error) {
      console.error(`Failed to delete record from ${key}:`, error);
      return false;
    }
  };
  
  // Convenience getter
  export const getCoursesFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem("courses")) || [];
    } catch (error) {
      console.error(`Failed to get courses from storage:`, error);
      return [];
    }
  };
  