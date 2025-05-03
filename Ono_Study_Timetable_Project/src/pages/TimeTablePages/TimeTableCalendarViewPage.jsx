import React, { useState, useCallback } from "react";
import {
  Button, Stack, CircularProgress, Typography, Box, Alert
} from "@mui/material";
import { Add as AddIcon } from '@mui/icons-material';
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx";
import { useEvents } from "../../context/EventsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers.js";

export default function TimeTableCalendarViewPage() {
  const { studentEvents, isLoadingEvents, refreshStudentEvents, error: eventsError } = useEvents();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null);
  const [modalDefaultDate, setModalDefaultDate] = useState(null);
  const [modalError, setModalError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPersonalEvent(null);
    setModalDefaultDate(null);
    setModalError("");
    setValidationErrors({});
  }, []);
  const handleDateClick = useCallback((info) => {
    if (!currentUser) {
      alert("Please log in to add personal events.");
      return;
    }
    setSelectedPersonalEvent(null);
    setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
    setModalError(""); setValidationErrors({});
    setIsModalOpen(true);
  }, [currentUser]);
  const handleEventClick = useCallback((info) => {
    const clickedEvent = info.event;
    const props = clickedEvent.extendedProps || {};
    if (props.type === 'studentEvent' && props.studentId && currentUser && props.studentId === currentUser.id) {
      const eventForModal = {
          eventCode: props.eventCode || clickedEvent.id,
          eventName: props.eventName || clickedEvent.title || '',
          notes: props.notes || '',
          date: props.startDate || '',
          allDay: props.allDay || false,
          startTime: props.allDay ? '' : (props.startHour || ''),
          endTime: props.allDay ? '' : (props.endHour || ''),
      };
      setSelectedPersonalEvent(eventForModal);
      setModalDefaultDate(null);
      setModalError(""); setValidationErrors({});
      setIsModalOpen(true);
    } else {
      alert(`Event Details:\n-----------------\nTitle: ${clickedEvent.title}\nType: ${props.type || 'Unknown'}\nStart: ${clickedEvent.start?.toLocaleString() ?? 'N/A'}${clickedEvent.allDay ? ' (All Day)' : ''}`);
    }
  }, [currentUser]);
  const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
    setModalError(""); setValidationErrors({});
    if (!currentUser?.id) { setModalError("User not logged in."); return; }
    const actionType = selectedPersonalEvent ? "edit" : "add";
    const entityKey = 'studentEvents';
    const eventDataForStorage = {
        eventCode: selectedPersonalEvent?.eventCode || formDataFromModal.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        eventName: formDataFromModal.eventName,
        notes: formDataFromModal.notes || "",
        startDate: formDataFromModal.date,
        endDate: formDataFromModal.date,
        allDay: formDataFromModal.allDay || false,
        startHour: formDataFromModal.allDay ? null : formDataFromModal.startTime,
        endHour: formDataFromModal.allDay ? null : formDataFromModal.endTime,
        studentId: currentUser.id,
    };
    try {
      const result = await handleSaveOrUpdateRecord( entityKey, eventDataForStorage, actionType, { recordType: 'studentEvent' } );
      if (result.success) {
        handleCloseModal();
        if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
        else { console.warn("refreshStudentEvents not available."); }
      } else {
        setValidationErrors(result.errors || {});
        setModalError(result.message || `Failed to ${actionType} event.`);
      }
    } catch (error) {
       console.error("[StudentView] Error calling handler:", error);
       setModalError(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
    }
  }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshStudentEvents]);
 const handleDeletePersonalEvent = useCallback((eventCodeToDelete) => {
     if (!eventCodeToDelete || !currentUser) return;
     if (!window.confirm(`Are you sure you want to delete this personal event?`)) return;
     setModalError(""); setValidationErrors({});
     handleDeleteEntityFormSubmit(
        "studentEvents", eventCodeToDelete,
        (successMessage) => {
            handleCloseModal();
            if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
            alert(successMessage || "Event deleted successfully!");
        },
        (errorMessage) => { setModalError(errorMessage || "Failed to delete the event."); }
     );
 }, [currentUser, handleCloseModal, refreshStudentEvents]);
  if (isLoadingEvents) {
    return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Your Timetable...</Typography>
       </Box>
    );
 }
  if (eventsError) {
       return (
            <Box sx={{ padding: { xs: "1rem", md: "2rem" } }}>
                <Alert severity="error"> Error loading timetable data: {eventsError.message || String(eventsError)} </Alert>
            </Box>
       );
  }
 return (
   <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
     <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2} >
       <Typography variant="h4" component="h1" gutterBottom={false}> My Timetable </Typography>
       {currentUser && (
           <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setSelectedPersonalEvent(null); setModalDefaultDate(new Date().toISOString().split('T')[0]); setModalError(""); setValidationErrors({}); setIsModalOpen(true); }} sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center'} }} >
             Add Personal Event
           </Button>
       )}
       {!currentUser && ( <Typography sx={{color: 'text.secondary'}}>Log in to add personal events.</Typography> )}
     </Stack>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
         <FullCalendarView
            events={studentEvents || []}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
         />
      </Box>
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