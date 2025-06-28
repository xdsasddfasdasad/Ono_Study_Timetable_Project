// src/context/EventsContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
// --- FIX: NO LONGER NEEDED ---
// import { formatAllEventsForCalendar } from '../utils/eventFormatters'; 
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents';

const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { currentUser, isLoading: isLoadingAuth } = useAuth();

  const [allVisibleEvents, setAllVisibleEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (isLoadingAuth) return;

    // --- FIX: The logic now includes a "guest" view ---
    // We can fetch events even if no user is logged in (they will just see public events).
    console.log(`[EventsContext] Fetching all visible events for user: ${currentUser?.uid || 'Guest'}`);
    setIsLoadingEvents(true);
    setError(null);

    try {
      // --- FIX: Simplified logic. getAllVisibleEvents now does everything. ---
      // It fetches, enriches, and formats the data.
      const formattedEvents = await getAllVisibleEvents(currentUser);
      console.log(`[EventsContext] Received ${formattedEvents.length} final, formatted events.`);
      setAllVisibleEvents(formattedEvents);

    } catch (err) {
      console.error("[EventsContext] Critical error fetching events:", err);
      setAllVisibleEvents([]);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentUser, isLoadingAuth]);

  useEffect(() => {
    // This effect runs once auth is settled, and re-runs if the user logs in/out.
    if (!isLoadingAuth) {
        fetchEvents();
    }
  }, [fetchEvents, isLoadingAuth]);

  const refreshEvents = useCallback(() => {
    console.log("[EventsContext] Manual refresh triggered.");
    fetchEvents();
  }, [fetchEvents]);

  const value = useMemo(() => ({
    allVisibleEvents,
    isLoadingEvents,
    refreshEvents,
    error,
  }), [allVisibleEvents, isLoadingEvents, refreshEvents, error]);

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