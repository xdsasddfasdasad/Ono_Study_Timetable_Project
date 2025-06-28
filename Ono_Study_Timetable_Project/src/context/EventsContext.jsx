// src/context/EventsContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
// This context needs to know who the current user is to fetch the correct events.
import { useAuth } from './AuthContext';
// The main utility function for fetching and processing all event types.
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents';

// Creates a new React Context to hold and provide all calendar event data.
const EventsContext = createContext(null);

// This is the Provider component. It's responsible for fetching all events visible to the
// current user (or public events for guests) and providing them to the application.
export const EventsProvider = ({ children }) => {
  // It consumes the AuthContext to get the current user and their auth loading state.
  const { currentUser, isLoadingAuth } = useAuth();

  // === STATE MANAGEMENT ===
  // `allVisibleEvents`: An array holding the final, formatted event objects ready for the calendar.
  const [allVisibleEvents, setAllVisibleEvents] = useState([]);
  // `isLoadingEvents`: A loading state specific to the event fetching process.
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  // `error`: Holds any error message from the fetching process.
  const [error, setError] = useState(null);

  // The core data fetching logic is wrapped in `useCallback` to prevent it from being
  // re-created on every render, which is important for performance and stability in `useEffect`.
  const fetchEvents = useCallback(async () => {
    // We don't attempt to fetch events until the initial authentication check is complete.
    if (isLoadingAuth) return;

    // The logic now correctly handles a "guest" view. If `currentUser` is null,
    // `getAllVisibleEvents` is designed to only fetch public events (like holidays).
    console.log(`[EventsContext] Fetching all visible events for user: ${currentUser?.uid || 'Guest'}`);
    setIsLoadingEvents(true);
    setError(null);

    try {
      // The logic has been simplified. The `getAllVisibleEvents` utility now handles all the
      // complexity of fetching multiple collections, enriching the data (e.g., adding lecturer names),
      // and formatting it into a single, consistent array for the calendar.
      const formattedEvents = await getAllVisibleEvents(currentUser);
      console.log(`[EventsContext] Received ${formattedEvents.length} final, formatted events.`);
      setAllVisibleEvents(formattedEvents);

    } catch (err) {
      console.error("[EventsContext] Critical error fetching events:", err);
      setAllVisibleEvents([]); // Clear any stale data on error.
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentUser, isLoadingAuth]); // This function will be re-created if the user or auth state changes.

  // This effect orchestrates the fetching of events.
  useEffect(() => {
    // It runs once the initial authentication check is done.
    if (!isLoadingAuth) {
        fetchEvents();
    }
    // It will also re-run if `fetchEvents` changes (i.e., when the user logs in or out),
    // ensuring the calendar data is always up-to-date with the current user's permissions.
  }, [fetchEvents, isLoadingAuth]);

  // This function is provided to child components to allow them to manually trigger a data refresh
  // after they have performed an action that changes the event data (e.g., adding/editing an event).
  const refreshEvents = useCallback(() => {
    console.log("[EventsContext] Manual refresh triggered.");
    fetchEvents();
  }, [fetchEvents]);

  // The `value` object for the provider is memoized with `useMemo`.
  // This is a crucial performance optimization. It ensures that consumers of this context
  // will only re-render if the values they actually use (`allVisibleEvents`, `isLoadingEvents`, etc.) have changed.
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

// A custom hook for easy consumption of the EventsContext.
export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};