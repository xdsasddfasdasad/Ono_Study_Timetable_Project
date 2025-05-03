import React, { useState, useMemo, useCallback } from 'react';
import {
    Box, Typography, Stack, Button, CircularProgress, Alert, List, ListItem, ListItemText,
    ListSubheader, IconButton, Divider, Paper, Chip, Icon
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useEvents } from '../../context/EventsContext';
import { useAuth } from '../../context/AuthContext';
import StudentPersonalEventFormModal from '../../components/modals/forms/StudentPersonalEventFormModal.jsx';
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers.js";
import { format, parseISO, compareAsc } from 'date-fns';

const getEventStyle = (eventType) => {
    switch (eventType) {
        case 'courseMeeting': return { color: 'primary.main', label: 'Course' };
        case 'studentEvent': return { color: 'success.main', label: 'Personal' };
        case 'holiday': return { color: 'error.light', label: 'Holiday' };
        case 'vacation': return { color: 'warning.light', label: 'Vacation' };
        case 'event': return { color: 'secondary.main', label: 'Event' };
        case 'task': return { color: 'info.main', label: 'Task Due' };
        case 'yearMarker': return { color: 'text.disabled', label: 'Year Marker' };
        case 'semesterMarker': return { color: 'text.disabled', label: 'Semester Marker' };
        default: return { color: 'text.secondary', label: 'Other' };
    }
};

export default function TimeTableListViewPage() {
    const { studentEvents, isLoadingEvents, refreshStudentEvents, error: eventsError } = useEvents();
    const { currentUser } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [modalError, setModalError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    const groupedEvents = useMemo(() => {
        if (!studentEvents || studentEvents.length === 0) return {};
        const sortedEvents = [...studentEvents].sort((a, b) => {
            try {
                const startA = typeof a.start === 'string' ? parseISO(a.start) : a.start;
                const startB = typeof b.start === 'string' ? parseISO(b.start) : b.start;
                if (!startA || !startB || isNaN(startA.getTime()) || isNaN(startB.getTime())) return 0; // Handle invalid dates
                return compareAsc(startA, startB);
            } catch (e) { return 0; }
        });

        const groups = sortedEvents.reduce((acc, event) => {
            try {
                const startDate = typeof event.start === 'string' ? parseISO(event.start) : event.start;
                if (!startDate || isNaN(startDate.getTime())) throw new Error("Invalid start date");
                const dayKey = format(startDate, 'yyyy-MM-dd');
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(event);
            } catch (e) { console.error("Error grouping event:", event, e); }
            return acc;
        }, {});
        return groups;
    }, [studentEvents]);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedPersonalEvent(null);
        setModalDefaultDate(null);
        setModalError("");
        setValidationErrors({});
    }, []);

    const handleOpenAddModal = useCallback((dateStr = null) => {
        if (!currentUser) { alert("Please log in."); return; }
        setSelectedPersonalEvent(null);
        setModalDefaultDate(dateStr || new Date().toISOString().split('T')[0]);
        setModalError(""); setValidationErrors({});
        setIsModalOpen(true);
    }, [currentUser]);

    const handleOpenEditModal = useCallback((eventData) => {
        if (!currentUser || !eventData || eventData.type !== 'studentEvent' || eventData.studentId !== currentUser.id) return;
        const eventForModal = {
            eventCode: eventData.eventCode || eventData.id,
            eventName: eventData.eventName || eventData.title || '',
            notes: eventData.notes || '',
            date: eventData.startDate || '',
            allDay: eventData.allDay || false,
            startTime: eventData.allDay ? '' : (eventData.startHour || ''),
            endTime: eventData.allDay ? '' : (eventData.endHour || ''),
        };
        setSelectedPersonalEvent(eventForModal);
        setModalDefaultDate(null);
        setModalError(""); setValidationErrors({});
        setIsModalOpen(true);
    }, [currentUser]);

    const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
        setModalError(""); setValidationErrors({});
        if (!currentUser?.id) { setModalError("User not logged in."); return; }
        const actionType = selectedPersonalEvent ? "edit" : "add";
        const entityKey = 'studentEvents';
        const eventDataForStorage = {
            eventCode: selectedPersonalEvent?.eventCode || formDataFromModal.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            eventName: formDataFromModal.eventName, notes: formDataFromModal.notes || "", startDate: formDataFromModal.date,
            endDate: formDataFromModal.date, allDay: formDataFromModal.allDay || false,
            startHour: formDataFromModal.allDay ? null : formDataFromModal.startTime,
            endHour: formDataFromModal.allDay ? null : formDataFromModal.endTime, studentId: currentUser.id,
        };
        try {
          const result = await handleSaveOrUpdateRecord(entityKey, eventDataForStorage, actionType, { recordType: 'studentEvent' });
          if (result.success) {
            handleCloseModal();
            if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
            else { console.warn("refreshStudentEvents not available."); }
          } else {
            setValidationErrors(result.errors || {});
            setModalError(result.message || `Failed to ${actionType} event.`);
          }
        } catch (error) {
           setModalError(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
           console.error("[ListView] Error saving personal event:", error);
        }
    }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshStudentEvents]);

    const handleDeletePersonalEvent = useCallback((eventCodeToDelete) => {
         if (!eventCodeToDelete || !currentUser) return;
         if (!window.confirm(`Are you sure you want to delete this personal event?`)) return;
         setModalError(""); setValidationErrors({});
         handleDeleteEntityFormSubmit("studentEvents", eventCodeToDelete,
            (successMessage) => {
                handleCloseModal();
                if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
                alert(successMessage || "Event deleted successfully!");
            },
            (errorMessage) => { setModalError(errorMessage || "Failed to delete the event."); }
         );
    }, [currentUser, handleCloseModal, refreshStudentEvents]);

    if (isLoadingEvents) {
        return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}> <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading Timetable...</Typography> </Box> );
    }
    if (eventsError) {
        return ( <Box sx={{ padding: { xs: "1rem", md: "2rem" } }}> <Alert severity="error">Error loading timetable data: {String(eventsError)}</Alert> </Box> );
    }

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1000px", margin: "auto" }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} spacing={2} >
                <Typography variant="h4" component="h1"> My Timetable (List View) </Typography>
                {currentUser && ( <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAddModal()} > Add Personal Event </Button> )}
                {!currentUser && ( <Typography sx={{color: 'text.secondary'}}>Log in to add events.</Typography> )}
            </Stack>

            {Object.keys(groupedEvents).length === 0 && !isLoadingEvents && (
                 <Paper elevation={1} sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}> No events found in your timetable. </Paper>
            )}

            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }} subheader={<li />}>
                {Object.entries(groupedEvents).map(([dayKey, eventsOnDay]) => (
                    <Box component="li" key={`section-${dayKey}`} sx={{mb: 2}}>
                        <ListSubheader sx={{ bgcolor: 'grey.200', top: 0, zIndex: 1, borderRadius: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', py: 0.5 }}>
                                 {format(parseISO(dayKey), 'EEEE, MMMM d, yyyy')}
                            </Typography>
                        </ListSubheader>
                        <List dense disablePadding component="ul">
                            {eventsOnDay.map((event) => {
                                const props = event.extendedProps || {};
                                const eventStyle = getEventStyle(props.type);
                                const isEditable = props.type === 'studentEvent' && props.studentId === currentUser?.id;
                                let timeString = "All Day";
                                if (!event.allDay) {
                                    try {
                                        const start = parseISO(event.start); const end = parseISO(event.end);
                                        timeString = `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
                                    } catch { timeString = "Invalid Time"; }
                                }
                                let secondaryText = timeString;
                                if (props.type === 'courseMeeting') {
                                    if (props.lecturerName) secondaryText += ` - ${props.lecturerName}`;
                                    if (props.roomCode) secondaryText += ` @ Room ${props.roomCode}`;
                                }
                                if (props.type === 'task') {
                                     secondaryText = `Due ${timeString}`;
                                     if(props.courseName) secondaryText += ` (${props.courseName})`;
                                }
                                if (props.notes) secondaryText += ` | Notes: ${props.notes.substring(0, 40)}${props.notes.length > 40 ? '...' : ''}`;

                                return (
                                    <ListItem
                                        key={event.id || `event-${Math.random()}`}
                                        disablePadding
                                        secondaryAction={ isEditable ? (
                                            <Stack direction="row" spacing={0}>
                                                <IconButton edge="end" aria-label="edit" size="small" onClick={() => handleOpenEditModal(props)}> <EditIcon fontSize="small" /> </IconButton>
                                                <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeletePersonalEvent(props.eventCode)}> <DeleteIcon fontSize="small" /> </IconButton>
                                            </Stack>
                                          ) : null }
                                        sx={{ alignItems: 'flex-start', py: 0.8 }}
                                    >
                                        <Box sx={{ width: 4, bgcolor: eventStyle.color, alignSelf: 'stretch', mr: 1.5, borderRadius: '2px' }} />
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="body1" component="span"> {event.title || "Untitled Event"} </Typography>
                                                    <Chip label={eventStyle.label} size="small" sx={{ backgroundColor: eventStyle.color, color: '#fff', height: 18, fontSize: '0.65rem' }} />
                                                </Stack>
                                            }
                                            secondary={ <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}> {secondaryText} </Typography> }
                                        />
                                    </ListItem>
                                );
                             })}
                        </List>
                    </Box>
                ))}
            </List>

            {isModalOpen && ( <StudentPersonalEventFormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSavePersonalEvent} onDelete={handleDeletePersonalEvent} initialData={selectedPersonalEvent} defaultDate={modalDefaultDate} errorMessage={modalError} validationErrors={validationErrors} /> )}
        </Box>
    );
}