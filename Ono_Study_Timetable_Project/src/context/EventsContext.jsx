// src/context/EventsContext.js

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getStudentEvents } from '../utils/getStudentEvents';
import { useAuth } from './AuthContext';

const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [studentEvents, setStudentEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchEvents = useCallback(() => {
    if (currentUser && currentUser.id) {
      console.log(`EventsContext: Fetching events for student ID: ${currentUser.id}`);
      setIsLoadingEvents(true); // Set loading true *before* fetching
      try {
        const filteredEvents = getStudentEvents(currentUser.id);
        setStudentEvents(filteredEvents);
        console.log(`EventsContext: Fetched ${filteredEvents.length} events.`);
      } catch (error) {
        console.error("Error fetching student events:", error);
        setStudentEvents([]); // Clear events on error
      } finally {
        setIsLoadingEvents(false); // Set loading false *after* fetching/error
      }
    } else {
      // No user or user logged out
      setStudentEvents([]);
      setIsLoadingEvents(false); // Ensure loading is false if no user
      console.log("EventsContext: No user logged in, events cleared.");
    }
  }, [currentUser]); // Dependency: re-create fetchEvents if currentUser changes


  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); 

const refreshStudentEvents = () => {
  console.log("EventsContext: Manual refresh triggered.");
  fetchEvents(); // Simply call the memoized fetch function
};

// Value provided by the context
const value = {
  studentEvents,
  isLoadingEvents,
  refreshStudentEvents, // ✅ Expose the refresh function
};

return (
  <EventsContext.Provider value={value}>
    {children}
  </EventsContext.Provider>
);
};

// Custom hook remains the same
export const useEvents = () => {
const context = useContext(EventsContext);
if (context === undefined) {
  throw new Error('useEvents must be used within an EventsProvider');
}
return context;
};