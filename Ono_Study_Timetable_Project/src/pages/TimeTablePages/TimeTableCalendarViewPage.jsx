// /src/pages/TimeTablePages/TimeTableCalendarViewPage.jsx

import React, { useState, useEffect } from "react";
import { Button, Stack, CircularProgress, Typography, Alert } from "@mui/material"; // Added loading/error components
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx"; // Assuming .jsx
// import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx"; // Keep for later
// Import necessary functions from storage and potentially context
import { getRecords } from "../../utils/storage.js";
// import { useAuth } from "../../context/AuthContext.jsx"; // We might use this later for filtering/permissions

export default function TimeTableCalendarViewPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State for loading indicator
  const [error, setError] = useState(null); // State for error messages

  // const [isModalOpen, setIsModalOpen] = useState(false); // Keep for later interaction
  // const [selectedEvent, setSelectedEvent] = useState(null); // Keep for later interaction
  // const [defaultDate, setDefaultDate] = useState(null); // Keep for later interaction

  useEffect(() => {
    loadAllEvents(); // Load data when component mounts
  }, []);

  // Function to load ALL events from the 'allEvents' key
  const loadAllEvents = () => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors
    try {
      const allCalendarEvents = getRecords("allEvents"); // Get data prepared by seedEventsData

      if (!allCalendarEvents || allCalendarEvents.length === 0) {
        console.warn("No events found in localStorage key 'allEvents'. Did seeding run correctly?");
        // Set events to empty array, could also set an error message
        setEvents([]);
      } else {
         // Data in 'allEvents' should already be in a format FullCalendar understands
         // (id, title, start, end as ISO strings, allDay)
         console.log(`Loaded ${allCalendarEvents.length} events from 'allEvents'.`);
         setEvents(allCalendarEvents);
      }
    } catch (err) {
      console.error("Error loading events from localStorage:", err);
      setError("Failed to load calendar events. Please try refreshing.");
      setEvents([]); // Clear events on error
    } finally {
      setIsLoading(false); // Finish loading
    }
  };

  // --- Placeholder Handlers (we'll implement interaction later) ---
  const handleDateClick = (info) => {
    console.log("Date clicked:", info.dateStr);
    // Later: Open modal to add a *personal* event for this date?
    // setSelectedEvent(null);
    // setDefaultDate(new Date(info.dateStr));
    // setIsModalOpen(true);
    alert(`Date clicked: ${info.dateStr}\n(Add/Edit functionality not fully implemented in this view yet)`);
  };

  const handleEventClick = (info) => {
    console.log("Event clicked:", info.event);
    // Later: Check if it's a personal event and open modal for editing?
    // Or display event details in a popup/sidebar?
    alert(`Event clicked: ${info.event.title}\n(Add/Edit functionality not fully implemented in this view yet)`);
  };

  // --- Rendering Logic ---
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Calendar...</Typography>
      </div>
    );
  }

  if (error) {
     return (
       <div style={{ padding: "2rem" }}>
         <Alert severity="error">{error}</Alert>
         <Button onClick={loadAllEvents} sx={{ mt: 2 }}>Try Again</Button>
       </div>
     );
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* We can hide the "Add Personal Event" button for now if this view is only for display */}
      {/*
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Button variant="contained" color="primary" onClick={() => alert("Add event functionality pending")}>
          ➕ Add New Personal Event
        </Button>
      </Stack>
      */}

      <Typography variant="h4" gutterBottom>
        College Timetable
      </Typography>

      <FullCalendarView
        events={events} // Pass the loaded events
        onDateClick={handleDateClick} // Pass placeholder handlers
        onEventClick={handleEventClick} // Pass placeholder handlers
      />

      {/* Modal logic commented out for now */}
      {/* {isModalOpen && (
        <StudentPersonalEventFormModal
          // ... props ...
        />
      )} */}
    </div>
  );
}