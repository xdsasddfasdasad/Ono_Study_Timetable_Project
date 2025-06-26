import React, { useState, useCallback, useMemo } from "react";
import {
  Button, Stack, CircularProgress, Typography, Box, Alert,
  LinearProgress, Skeleton, Divider // ✨ 1. הוספת ייבוא
} from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx";
import { useEvents } from "../../context/EventsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers.js";

// ✨ 2. קומפוננטת עזר להצגת שלד של לוח השנה (ניתן להעביר לקובץ נפרד אם יש שימוש חוזר)
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

export default function TimeTableCalendarViewPage() {
  const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
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

  const handleOpenAddModal = useCallback((info) => {
    if (!currentUser) { alert("Please log in to add personal events."); return; }
    setSelectedPersonalEvent(null);
    setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  }, [currentUser]);

  const handleEventClick = useCallback((info) => {
    const clickedEvent = info.event;
    const props = clickedEvent.extendedProps || {};
    const type = props.type || 'unknown';

    if (type === 'studentEvent' && props.studentId && currentUser && props.studentId === currentUser.uid) {
      const eventForModal = { eventCode: props.eventCode || clickedEvent.id, eventName: props.eventName || clickedEvent.title || '', notes: props.notes || '', startDate: props.startDate || '', allDay: props.allDay || false, startHour: props.allDay ? '' : (props.startHour || ''), endHour: props.allDay ? '' : (props.endHour || ''), };
      setSelectedPersonalEvent(eventForModal);
      setIsModalOpen(true);
    } else if (type === 'holiday' || type === 'vacation') {
        const startDate = clickedEvent.start ? clickedEvent.start.toLocaleDateString() : 'N/A';
        const endDate = clickedEvent.end ? new Date(clickedEvent.end.getTime() - 1).toLocaleDateString() : startDate;
        let details = `Event: ${clickedEvent.title}\nType: ${type.charAt(0).toUpperCase() + type.slice(1)}\nDuration: ${startDate}`;
        if (startDate !== endDate) { details += ` to ${endDate}`; }
        alert(details);
    } else {
      alert( `Event Details:\n\nTitle: ${clickedEvent.title}\nType: ${type}\nStart: ${clickedEvent.start?.toLocaleString() ?? 'N/A'}${clickedEvent.allDay ? '' : `\nEnd: ${clickedEvent.end?.toLocaleString() ?? 'N/A'}`}` );
    }
  }, [currentUser]);

  const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
    setModalError("");
    setValidationErrors({});
    if (!currentUser?.uid) { setModalError("User not identified. Please log in again."); return; }

    const mode = selectedPersonalEvent ? "edit" : "add";
    const eventDataForStorage = { ...formDataFromModal, eventCode: selectedPersonalEvent?.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, endDate: formDataFromModal.startDate, studentId: currentUser.uid, type: "studentEvent", };
    if (eventDataForStorage.allDay) { eventDataForStorage.startHour = null; eventDataForStorage.endHour = null; }

    const result = await handleSaveOrUpdateRecord( 'studentEvents', eventDataForStorage, mode, { recordType: 'studentEvent', editingId: selectedPersonalEvent?.eventCode || null } );

    if (result.success) {
      handleCloseModal();
      if (typeof refreshEvents === 'function') refreshEvents();
    } else {
      setValidationErrors(result.errors || {});
      setModalError(result.message || `Failed to ${mode} event.`);
    }
  }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshEvents]);

  const handleDeletePersonalEvent = useCallback(async (eventCodeToDelete) => {
    if (!eventCodeToDelete || !window.confirm("Are you sure you want to delete this personal event?")) return;
    setModalError("");
    const result = await handleDeleteEntity("studentEvents", eventCodeToDelete);
    if (result.success) {
      handleCloseModal();
      alert(result.message);
      if (typeof refreshEvents === 'function') refreshEvents();
    } else {
      setModalError(result.message || "Failed to delete the event.");
    }
  }, [handleCloseModal, refreshEvents]);

  // ✨ 3. הסרת החזרה המוקדמת של ה-CircularProgress
  if (eventsError) {
    return (
      <Box sx={{ padding: { xs: "1rem", md: "2rem" } }}>
        <Alert severity="error"> Error loading data: {String(eventsError)} </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        spacing={2}
      >
        <Typography variant="h4" component="h1" gutterBottom={false}>
          My Timetable
        </Typography>
        {currentUser ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenAddModal({ dateStr: new Date().toISOString().split('T')[0] })}
            sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'flex-start', sm: 'center' } }}
            disabled={isLoadingEvents} // השבתת הכפתור בזמן טעינה
          >
            Add Personal Event
          </Button>
        ) : (
          <Typography sx={{ color: 'text.secondary' }}>
            Log in to add personal events.
          </Typography>
        )}
      </Stack>

      {/* ✨ 4. הוספת LinearProgress גלובלי לעמוד */}
      <Box sx={{ height: 4, mb: 2 }}>
        {isLoadingEvents && <LinearProgress />}
      </Box>

      {/* ✨ 5. לוגיקת תצוגה משופרת */}
      {isLoadingEvents && !allVisibleEvents.length ? (
        <CalendarSkeleton />
      ) : (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 1,
            p: { xs: 0.5, sm: 1 }
          }}
        >
          <FullCalendarView
            events={allVisibleEvents || []}
            onDateClick={handleOpenAddModal}
            onEventClick={handleEventClick}
          />
        </Box>
      )}

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