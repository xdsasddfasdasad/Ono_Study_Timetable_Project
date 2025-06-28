// src/pages/TimeTableCalendarViewPage.jsx

import React, { useState, useCallback, useMemo } from "react";
// Imports Material-UI components for layout and loading states.
import {
  Button, Stack, CircularProgress, Typography, Box, Alert,
  LinearProgress, Skeleton, Divider 
} from "@mui/material";
// Imports the main calendar view component and the modal for personal events.
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx";
// Imports the contexts to get global event and authentication data.
import { useEvents } from "../../context/EventsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
// Imports the central handlers for saving and deleting data.
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers.js";

// A helper component to show a "skeleton" of the calendar while its data is loading.
// This improves the perceived performance and prevents jarring layout shifts.
const CalendarSkeleton = () => (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" p={1}>
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={150} />
            <Skeleton variant="text" width={100} />
        </Stack>
        <Divider />
        <Skeleton variant="rectangular" height={{ xs: 400, sm: 600 }} />
    </Box>
);

// This is the main "smart" page component for displaying the user's timetable in a calendar view.
// It orchestrates data fetching (via context), user interactions, and modal management.
export default function TimeTableCalendarViewPage() {
  // === CONTEXT CONSUMPTION ===
  // Get all necessary data and functions from the global contexts.
  const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
  const { currentUser } = useAuth();

  // === STATE MANAGEMENT ===
  // State specifically for managing the personal event modal.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null); // Holds data for editing.
  const [modalDefaultDate, setModalDefaultDate] = useState(null); // For opening the modal on a specific date.
  const [modalError, setModalError] = useState(""); // General error message for the modal.
  const [validationErrors, setValidationErrors] = useState({}); // Field-specific errors for the modal.

  // === MODAL HANDLERS ===
  // A memoized function to close the modal and reset all related state.
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPersonalEvent(null);
    setModalDefaultDate(null);
    setModalError("");
    setValidationErrors({});
  }, []);

  // Opens the modal in "add" mode, pre-populating it with the clicked date.
  const handleOpenAddModal = useCallback((info) => {
    if (!currentUser) { alert("Please log in to add personal events."); return; }
    setSelectedPersonalEvent(null);
    setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  }, [currentUser]);

  // The master handler for when any event on the calendar is clicked.
  const handleEventClick = useCallback((info) => {
    const clickedEvent = info.event;
    const props = clickedEvent.extendedProps || {};
    const type = props.type || 'unknown';

    // Business logic: Only allow editing of 'studentEvent' types if the user is the owner.
    if (type === 'studentEvent' && props.studentId && currentUser && props.studentId === currentUser.uid) {
      // Prepare the event data for the modal's initial state.
      const eventForModal = { eventCode: props.eventCode || clickedEvent.id, eventName: props.eventName || clickedEvent.title || '', notes: props.notes || '', startDate: props.startDate || '', allDay: props.allDay || false, startHour: props.allDay ? '' : (props.startHour || ''), endHour: props.allDay ? '' : (props.endHour || ''), };
      setSelectedPersonalEvent(eventForModal);
      setIsModalOpen(true);
    } else if (type === 'holiday' || type === 'vacation') {
        // For public events like holidays, just show a simple alert with details.
        const startDate = clickedEvent.start ? clickedEvent.start.toLocaleDateString() : 'N/A';
        const endDate = clickedEvent.end ? new Date(clickedEvent.end.getTime() - 1).toLocaleDateString() : startDate;
        let details = `Event: ${clickedEvent.title}\nType: ${type.charAt(0).toUpperCase() + type.slice(1)}\nDuration: ${startDate}`;
        if (startDate !== endDate) { details += ` to ${endDate}`; }
        alert(details);
    } else {
      // For all other read-only event types (like course meetings), show a simple alert.
      alert( `Event Details:\n\nTitle: ${clickedEvent.title}\nType: ${type}\nStart: ${clickedEvent.start?.toLocaleString() ?? 'N/A'}${clickedEvent.allDay ? '' : `\nEnd: ${clickedEvent.end?.toLocaleString() ?? 'N/A'}`}` );
    }
  }, [currentUser]);

  // === DATA HANDLERS (Passed to Modal) ===
  // Handles the save/update logic when the user submits the personal event form.
  const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
    setModalError(""); setValidationErrors({});
    if (!currentUser?.uid) { setModalError("User not identified. Please log in again."); return; }

    const mode = selectedPersonalEvent ? "edit" : "add";
    // Prepare the data payload for Firestore.
    const eventDataForStorage = { ...formDataFromModal, eventCode: selectedPersonalEvent?.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, endDate: formDataFromModal.startDate, studentId: currentUser.uid, type: "studentEvent", };
    if (eventDataForStorage.allDay) { eventDataForStorage.startHour = null; eventDataForStorage.endHour = null; }

    // Delegate the actual database operation to the central handler.
    const result = await handleSaveOrUpdateRecord( 'studentEvents', eventDataForStorage, mode, { recordType: 'studentEvent', editingId: selectedPersonalEvent?.eventCode || null } );

    if (result.success) {
      handleCloseModal();
      if (typeof refreshEvents === 'function') refreshEvents(); // Refresh the main event list on success.
    } else {
      setValidationErrors(result.errors || {});
      setModalError(result.message || `Failed to ${mode} event.`);
    }
  }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshEvents]);

  // Handles the delete logic for a personal event.
  const handleDeletePersonalEvent = useCallback(async (eventCodeToDelete) => {
    if (!eventCodeToDelete || !window.confirm("Are you sure you want to delete this personal event?")) return;
    setModalError("");
    const result = await handleDeleteEntity("studentEvents", eventCodeToDelete);
    if (result.success) {
      handleCloseModal();
      alert(result.message);
      if (typeof refreshEvents === 'function') refreshEvents(); // Refresh events on success.
    } else {
      setModalError(result.message || "Failed to delete the event.");
    }
  }, [handleCloseModal, refreshEvents]);

  // Render an error message if the main event fetching fails.
  if (eventsError) {
    return (
      <Box sx={{ padding: { xs: "1rem", md: "2rem" } }}>
        <Alert severity="error"> Error loading data: {String(eventsError)} </Alert>
      </Box>
    );
  }

  // Main render output for the page.
  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={1} spacing={2}>
        <Typography variant="h4" component="h1" gutterBottom={false}>
          My Timetable
        </Typography>
        {currentUser ? (
          <Button variant="contained" color="primary" onClick={() => handleOpenAddModal({ dateStr: new Date().toISOString().split('T')[0] })} sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }} disabled={isLoadingEvents}>
            Add Personal Event
          </Button>
        ) : (
          <Typography sx={{ color: 'text.secondary' }}>
            Log in to add personal events.
          </Typography>
        )}
      </Stack>

      {/* A global loading bar for the page, shown when events are being fetched. */}
      <Box sx={{ height: 4, mb: 2 }}>
        {isLoadingEvents && <LinearProgress />}
      </Box>

      {/* Improved rendering logic: Show the skeleton only on the initial load when there are no events yet. */}
      {isLoadingEvents && !allVisibleEvents.length ? (
        <CalendarSkeleton />
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
          <FullCalendarView
            events={allVisibleEvents || []}
            onDateClick={handleOpenAddModal}
            onEventClick={handleEventClick}
          />
        </Box>
      )}

      {/* The modal is rendered here but is only visible when `isModalOpen` is true. */}
      {isModalOpen && (
        <StudentPersonalEventFormModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSavePersonalEvent}
          onDelete={handleDeletePersonalEvent}
          initialData={selectedPersonalEvent}
          defaultDate={modalDefaultDate}
          errorMessage={modalError}
          validationErrors={validationErrors}
        />
      )}
    </Box>
  );
}