import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents'; // Use the async Firestore function
import { useAuth } from './AuthContext'; // Use the Firebase-based AuthContext

const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { currentUser, isLoading: isLoadingAuth } = useAuth();
  const [studentEvents, setStudentEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (isLoadingAuth) {
        console.log("[EventsContext] Skipping fetch: Auth still loading.");
        setIsLoadingEvents(true); // Keep showing loading indicator for events
        return;
    }
    // Fetch only if currentUser has a UID (indicating logged in)
    if (!currentUser?.uid) {
        console.log("[EventsContext] No user UID found, clearing events.");
        setStudentEvents([]);
        setIsLoadingEvents(false);
        setEventsError(null);
        return;
    }

    console.log(`[EventsContext] Fetching events from Firestore for user UID: ${currentUser.uid}`);
    setIsLoadingEvents(true);
    setEventsError(null);

    try {
        // Pass the entire currentUser object, getAllVisibleEvents might need more than just UID
        const fetchedEvents = await getAllVisibleEvents(currentUser);
        console.log(`[EventsContext] Fetched ${fetchedEvents.length} events.`);
        setStudentEvents(fetchedEvents);
    } catch (error) {
        console.error("[EventsContext] Error fetching student events:", error);
        setStudentEvents([]);
        setEventsError(error);
    } finally {
        setIsLoadingEvents(false);
    }
  }, [currentUser, isLoadingAuth]); // Dependencies: run if user or auth loading state changes


  useEffect(() => {
    // Trigger fetch only when auth is done loading
    if (!isLoadingAuth) {
      fetchEvents();
    }
  }, [fetchEvents, isLoadingAuth]); // Depend on fetchEvents identity and auth loading state


  const refreshStudentEvents = useCallback(() => {
      console.log("[EventsContext] Manual refresh triggered.");
      fetchEvents(); // Call the async fetch function
  }, [fetchEvents]);


  const value = {
    studentEvents,
    isLoadingEvents,
    refreshStudentEvents,
    error: eventsError,
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