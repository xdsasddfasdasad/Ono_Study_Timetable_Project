import React, { useState, useCallback } from "react";
import {
  Button, Stack, CircularProgress, Typography, Box, Alert
} from "@mui/material";
import { Add as AddIcon } from '@mui/icons-material';
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx";
import { useEvents } from "../../context/EventsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers.js"; // These need to be Firestore-ready

// Note: Color constants are not defined here as it's assumed that
// the `studentEvents` array coming from `EventsContext` (via `getAllVisibleEvents`)
// already contains fully formatted events with their specific color properties.

export default function TimeTableCalendarViewPage() {
  const { studentEvents, isLoadingEvents, refreshStudentEvents, error: eventsError } = useEvents();
  const { currentUser } = useAuth(); // From Firebase-based AuthContext

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null);
  const [modalDefaultDate, setModalDefaultDate] = useState(null);
  const [modalError, setModalError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false); setSelectedPersonalEvent(null); setModalDefaultDate(null);
    setModalError(""); setValidationErrors({});
  }, []);

  const handleDateClick = useCallback((info) => {
    if (!currentUser) { alert("Please log in to add personal events."); return; }
    setSelectedPersonalEvent(null);
    setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
    setModalError(""); setValidationErrors({});
    setIsModalOpen(true);
  }, [currentUser]);

  const handleEventClick = useCallback((info) => {
    const clickedEvent = info.event;
    const props = clickedEvent.extendedProps || {};

    if (props.type === 'studentEvent' && props.studentId && currentUser && props.studentId === currentUser.uid) { // Check against UID
      const eventForModal = {
          eventCode: props.eventCode || clickedEvent.id,
          eventName: props.eventName || clickedEvent.title || '',
          notes: props.notes || '', date: props.startDate || '', allDay: props.allDay || false,
          startTime: props.allDay ? '' : (props.startHour || ''),
          endTime: props.allDay ? '' : (props.endHour || ''),
      };
      setSelectedPersonalEvent(eventForModal);
      setModalDefaultDate(null); setModalError(""); setValidationErrors({});
      setIsModalOpen(true);
    } else {
      alert(`Event Details:\nTitle: ${clickedEvent.title}\nType: ${props.type || 'N/A'}\nStart: ${clickedEvent.start?.toLocaleString() ?? 'N/A'}${clickedEvent.allDay ? ' (All Day)' : ''}`);
    }
  }, [currentUser]);

  const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
    setModalError(""); setValidationErrors({});
    if (!currentUser?.uid) { setModalError("User not identified."); return; } // Check UID

    const actionType = selectedPersonalEvent ? "edit" : "add";
    const entityKey = 'studentEvents';
    const recordTypeForValidation = 'studentEvent';

    const eventDataForStorage = {
        eventCode: selectedPersonalEvent?.eventCode || formDataFromModal.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        eventName: formDataFromModal.eventName, notes: formDataFromModal.notes || "",
        startDate: formDataFromModal.date, endDate: formDataFromModal.date,
        allDay: formDataFromModal.allDay || false,
        startHour: formDataFromModal.allDay ? null : formDataFromModal.startTime,
        endHour: formDataFromModal.allDay ? null : formDataFromModal.endTime,
        studentId: currentUser.uid, // Use Firebase UID
    };

    try {
      // Assuming handleSaveOrUpdateRecord is Firestore-ready and will perform async validation
      const result = await handleSaveOrUpdateRecord(
          entityKey,
          eventDataForStorage,
          actionType,
          { recordType: recordTypeForValidation, editingId: selectedPersonalEvent?.eventCode || null },
          false // Let handler run validation (which should be async and Firestore-aware)
      );
      if (result.success) {
        handleCloseModal();
        if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
      } else {
        setValidationErrors(result.errors || {});
        setModalError(result.message || `Failed to ${actionType} event.`);
      }
    } catch (error) {
       setModalError(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
       console.error("[StudentView:SaveEvent] Error:", error);
    }
  }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshStudentEvents]);

 const handleDeletePersonalEvent = useCallback((eventCodeToDelete) => {
     if (!eventCodeToDelete || !currentUser?.uid) return;
     if (!window.confirm(`Are you sure you want to delete this personal event?`)) return;
     setModalError(""); setValidationErrors({});

     // Assuming handleDeleteEntityFormSubmit is Firestore-ready
     handleDeleteEntityFormSubmit( "studentEvents", eventCodeToDelete,
        (successMessage) => {
            handleCloseModal();
            if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
            alert(successMessage || "Event deleted successfully!");
        },
        (errorMessage) => { setModalError(errorMessage || "Failed to delete event."); },
        currentUser.uid // Pass studentId as parentIdentifier for potential Firestore rule check
     );
 }, [currentUser, handleCloseModal, refreshStudentEvents]);

  if (isLoadingEvents) {
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}> <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading Timetable...</Typography> </Box> );
  }
  if (eventsError) {
       return ( <Box sx={{ padding: { xs: "1rem", md: "2rem" } }}> <Alert severity="error"> Error loading data: {String(eventsError)} </Alert> </Box> );
  }

 return (
   <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
     <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2} >
       <Typography variant="h4" component="h1" gutterBottom={false}> My Timetable </Typography>
       {currentUser && ( <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setSelectedPersonalEvent(null); setModalDefaultDate(new Date().toISOString().split('T')[0]); setModalError(""); setValidationErrors({}); setIsModalOpen(true); }} sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center'} }} > Add Personal Event </Button> )}
       {!currentUser && ( <Typography sx={{color: 'text.secondary'}}>Log in to add personal events.</Typography> )}
     </Stack>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
         <FullCalendarView events={studentEvents || []} onDateClick={handleDateClick} onEventClick={handleEventClick} />
      </Box>
     {isModalOpen && ( <StudentPersonalEventFormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSavePersonalEvent} onDelete={handleDeletePersonalEvent} initialData={selectedPersonalEvent} defaultDate={modalDefaultDate} errorMessage={modalError} validationErrors={validationErrors} /> )}
   </Box>
 );
}