    import React, { useState, useMemo, useCallback } from 'react';
    import {
        Box, Typography, Stack, Button, CircularProgress, Alert, List, ListItem, ListItemText,
        ListSubheader, IconButton, Divider, Paper, Chip
    } from '@mui/material';
    import { format, parseISO, compareAsc } from 'date-fns';

    import { useEvents } from '../../context/EventsContext';
    import { useAuth } from '../../context/AuthContext';
    import StudentPersonalEventFormModal from '../../components/modals/forms/StudentPersonalEventFormModal.jsx';
    // --- FIX 1: Import the correct handler names ---
    import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers.js";

    // Helper to get styling for each event type chip
    const getEventStyle = (eventType) => {
        const styles = {
            courseMeeting: { color: '#3788d8', label: 'Course' },
            studentEvent: { color: '#ffc107', label: 'Personal' },
            holiday: { color: '#e3342f', label: 'Holiday' },
            vacation: { color: '#f6993f', label: 'Vacation' },
            event: { color: '#38c172', label: 'Event' },
            task: { color: '#8e44ad', label: 'Task Due' },
            yearMarker: { color: '#a5d6a7', label: 'Year Marker' },
            semesterMarker: { color: '#81d4fa', label: 'Semester Marker' },
            default: { color: '#6c757d', label: 'Other' }
        };
        return styles[eventType] || styles.default;
    };

    export default function TimeTableListViewPage() {
        // --- FIX 2: Use the unified events array and refresh function from the context ---
        const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
        const { currentUser } = useAuth();

        const [isModalOpen, setIsModalOpen] = useState(false);
        const [selectedPersonalEvent, setSelectedPersonalEvent] = useState(null);
        const [modalDefaultDate, setModalDefaultDate] = useState(null);
        const [modalError, setModalError] = useState("");
        const [validationErrors, setValidationErrors] = useState({});

        const groupedEvents = useMemo(() => {
            // Use allVisibleEvents instead of studentEvents
            if (!allVisibleEvents || allVisibleEvents.length === 0) return {};
            
            const sortedEvents = [...allVisibleEvents].sort((a, b) => {
                try {
                    // The 'start' property is already a Date object or an ISO string from our formatter
                    const startA = typeof a.start === 'string' ? parseISO(a.start) : a.start;
                    const startB = typeof b.start === 'string' ? parseISO(b.start) : b.start;
                    return compareAsc(startA, startB);
                } catch (e) { return 0; }
            });

            return sortedEvents.reduce((acc, event) => {
                try {
                    const startDate = typeof event.start === 'string' ? parseISO(event.start) : event.start;
                    const dayKey = format(startDate, 'yyyy-MM-dd');
                    if (!acc[dayKey]) acc[dayKey] = [];
                    acc[dayKey].push(event);
                } catch (e) { console.error("Error grouping event:", event, e); }
                return acc;
            }, {});
        }, [allVisibleEvents]);

        const handleCloseModal = useCallback(() => {
            setIsModalOpen(false); setSelectedPersonalEvent(null);
            setModalDefaultDate(null); setModalError(""); setValidationErrors({});
        }, []);

        const handleOpenAddModal = useCallback((dateStr = null) => {
            if (!currentUser) { alert("Please log in to add personal events."); return; }
            setSelectedPersonalEvent(null);
            setModalDefaultDate(dateStr || new Date().toISOString().split('T')[0]);
            setIsModalOpen(true);
        }, [currentUser]);

        const handleOpenEditModal = useCallback((eventProps) => {
            if (!currentUser) return;
            // --- FIX 3: Ensure data passed to modal uses correct field names ---
            const eventForModal = {
                eventCode: eventProps.eventCode || eventProps.id,
                eventName: eventProps.eventName || eventProps.title,
                notes: eventProps.notes || '',
                startDate: eventProps.startDate, // Was 'date'
                allDay: eventProps.allDay || false,
                startHour: eventProps.allDay ? '' : (eventProps.startHour || ''), // Was 'startTime'
                endHour: eventProps.allDay ? '' : (eventProps.endHour || ''),     // Was 'endTime'
            };
            setSelectedPersonalEvent(eventForModal);
            setIsModalOpen(true);
        }, [currentUser]);

        const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
            setModalError(""); setValidationErrors({});
            if (!currentUser?.uid) { setModalError("User not logged in."); return; }
            
            const mode = selectedPersonalEvent ? "edit" : "add";
            const entityKey = 'studentEvents';
            
            const eventDataForStorage = {
                ...formDataFromModal,
                eventCode: selectedPersonalEvent?.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                endDate: formDataFromModal.startDate,
                studentId: currentUser.uid,
                type: 'studentEvent',
            };

            if (eventDataForStorage.allDay) {
                eventDataForStorage.startHour = null;
                eventDataForStorage.endHour = null;
            }

            const result = await handleSaveOrUpdateRecord(
                entityKey, eventDataForStorage, mode, 
                { recordType: 'studentEvent', editingId: selectedPersonalEvent?.eventCode || null }
            );
            
            if (result.success) {
                handleCloseModal();
                if (typeof refreshEvents === 'function') { refreshEvents(); }
            } else {
                setValidationErrors(result.errors || {});
                setModalError(result.message || `Failed to ${mode} event.`);
            }
        }, [currentUser, selectedPersonalEvent, handleCloseModal, refreshEvents]);

        // --- FIX 4: Update the delete handler to be async and use the new handler name ---
        const handleDeletePersonalEvent = useCallback(async (eventCodeToDelete) => {
            if (!eventCodeToDelete || !currentUser) return;
            if (!window.confirm(`Are you sure you want to delete this personal event?`)) return;

            const result = await handleDeleteEntity("studentEvents", eventCodeToDelete);
            
            if(result.success) {
                handleCloseModal(); // Close modal if it was open for editing
                if (typeof refreshEvents === 'function') { refreshEvents(); }
                alert(result.message || "Event deleted successfully!");
            } else {
                // In a real app, you might show this error somewhere other than the modal
                alert(`Deletion failed: ${result.message}`);
            }
        }, [currentUser, handleCloseModal, refreshEvents]);


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
                    {currentUser && ( <Button variant="contained" onClick={() => handleOpenAddModal()} > Add Personal Event </Button> )}
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
                                    const isEditable = props.type === 'studentEvent' && props.studentId === currentUser?.uid;
                                    
                                    let timeString = "All Day";
                                    if (!event.allDay) {
                                        try {
                                            const start = parseISO(event.start);
                                            timeString = format(start, 'HH:mm');
                                            if (event.end) {
                                                const end = parseISO(event.end);
                                                if (end > start) timeString += ` - ${format(end, 'HH:mm')}`;
                                            }
                                        } catch { timeString = "Invalid Time"; }
                                    }
                                    
                                    let secondaryText = timeString;
                                    if (props.type === 'courseMeeting') {
                                        if (props.lecturerName) secondaryText += ` - ${props.lecturerName}`;
                                        if (props.roomCode) secondaryText += ` @ Room ${props.roomCode}`;
                                    } else if (props.notes) {
                                        secondaryText += ` | ${props.notes}`;
                                    }

                                    return (
                                        <ListItem
                                            key={event.id || `event-${Math.random()}`}
                                            disablePadding
                                            secondaryAction={ isEditable ? (
                                                <Stack direction="row" spacing={0}>
                                                    <IconButton edge="end" aria-label="edit" size="small" onClick={() => handleOpenEditModal(props)}>
                                                        {/* Edit Icon can be here */}
                                                    </IconButton>
                                                    <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeletePersonalEvent(props.eventCode)}>
                                                        {/* Delete Icon can be here */}
                                                    </IconButton>
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
                            <Divider />
                        </Box>
                    ))}
                </List>

                {isModalOpen && ( <StudentPersonalEventFormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSavePersonalEvent} onDelete={handleDeletePersonalEvent} initialData={selectedPersonalEvent} defaultDate={modalDefaultDate} errorMessage={modalError} validationErrors={validationErrors} /> )}
            </Box>
        );
    }