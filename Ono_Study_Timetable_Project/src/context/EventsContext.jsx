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
      setIsLoadingEvents(true);
      try {
        const filteredEvents = getStudentEvents(currentUser.id);
        setStudentEvents(filteredEvents);
        console.log(`EventsContext: Fetched ${filteredEvents.length} events.`);
      } catch (error) {
        console.error("Error fetching student events:", error);
        setStudentEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    } else {
      setStudentEvents([]);
      setIsLoadingEvents(false); 
      console.log("EventsContext: No user logged in, events cleared.");
    }
  }, [currentUser]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]); 

const refreshStudentEvents = () => {
  console.log("EventsContext: Manual refresh triggered.");
  fetchEvents();
};
const value = {
  studentEvents,
  isLoadingEvents,
  refreshStudentEvents,
};

return (
  <EventsContext.Provider value={value}>
    {children}
  </EventsContext.Provider>
);
};
export const useEvents = () => {
const context = useContext(EventsContext);
if (context === undefined) {
  throw new Error('useEvents must be used within an EventsProvider');
}
return context;
};