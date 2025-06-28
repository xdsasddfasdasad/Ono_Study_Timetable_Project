// src/pages/TimeTableManagementPage.jsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
// Imports a wide range of Material-UI components for layout and loading states.
import { Button, Stack, CircularProgress, Typography, Box, Alert, Skeleton, LinearProgress, Paper, Divider } from "@mui/material";

// Imports all the necessary "smart" modal components that this page will manage.
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import TimeTableEditModal from "../../components/modals/TimeTableEditModal";
import EntitiesManageModal from "../../components/modals/EntitiesManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
import ManageCourseMeetingsModal from "../../components/modals/ManageCourseMeetingsModal";

// Imports the context for event data and the Firestore service.
import { useEvents } from "../../context/EventsContext";
import { fetchCollection } from "../../firebase/firestoreService";

// A helper component to show a "skeleton" of the calendar while its data is loading.
const CalendarSkeleton = () => (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" p={1}>
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={150} />
            <Skeleton variant="text" width={100} />
        </Stack>
        <Divider />
        <Skeleton variant="rectangular" height={600} />
    </Box>
);

// This is the main "smart" page component for the admin management console.
// It displays an admin-focused calendar and provides buttons to open various management modals.
// It acts as a master controller, deciding which modal to show based on user actions.
export default function TimeTableManagementPage() {
    // === STATE MANAGEMENT ===
    const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
    const [allCourses, setAllCourses] = useState([]); // A local cache of all course definitions.
    const [isLoadingCourses, setIsLoadingCourses] = useState(true); // Loading state for the courses list.

    // `activeModal` is the key state that determines which modal (if any) is currently displayed.
    const [activeModal, setActiveModal] = useState(null);
    // `modalData` holds any initial data that needs to be passed to the modal being opened (e.g., for editing).
    const [modalData, setModalData] = useState(null);

    // === DATA FETCHING ===
    // A memoized function to fetch the list of all courses, which is needed by several modals.
    const loadCourseList = useCallback(async () => {
        setIsLoadingCourses(true);
        try {
            setAllCourses(await fetchCollection("courses") || []);
        } catch (err) { console.error("Error loading course list:", err);
        } finally { setIsLoadingCourses(false); }
    }, []);

    // Fetch the course list when the component mounts.
    useEffect(() => {
        loadCourseList();
    }, [loadCourseList]);

    // A memoized calculation to create a filtered view of events for the admin calendar.
    // It excludes personal student events to provide a cleaner, system-wide overview.
    const adminCalendarEvents = useMemo(() => {
        return allVisibleEvents.filter(event => event.extendedProps?.type !== 'studentEvent');
    }, [allVisibleEvents]);

    // === HANDLERS ===
    // A single, memoized function to close any active modal and reset related data.
    const handleCloseModals = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
    }, []);

    // A handler passed to all modals. When a sub-modal reports a successful save,
    // this function closes the modal and triggers a refresh of all relevant data.
    const handleSaveSuccess = useCallback(() => {
        handleCloseModals();
        refreshEvents(); // Refresh the main calendar events.
        loadCourseList(); // Re-fetch the course list as it may have changed.
    }, [refreshEvents, loadCourseList, handleCloseModals]);
    
    // The master handler for when any event on the admin calendar is clicked.
    // It uses a switch statement to determine which modal to open based on the event's type.
    const handleEventClick = useCallback((clickInfo) => {
        const event = clickInfo.event;
        const props = event.extendedProps;

        switch (props?.type) {
            case 'courseMeeting':
                // For a course meeting, open the dedicated meeting manager modal.
                setModalData(props);
                setActiveModal('courseMeetings');
                break;
            case 'holiday': case 'vacation': case 'event': case 'task': case 'yearMarker': case 'semesterMarker':
                {
                    // For most other event types, open the generic "Edit Entry" modal.
                    let recordType = props.type;
                    // Handle special cases where the event type doesn't match the record type.
                    if (props.type === 'yearMarker') recordType = 'year';
                    if (props.type === 'semesterMarker') recordType = 'semester';
                    // Prepare the data to be passed to the edit modal.
                    const dataForModal = { ...props, type: recordType, id: event.id, title: event.title, start: event.start, end: event.end, allDay: event.allDay };
                    setModalData(dataForModal);
                    setActiveModal('editEntry');
                }
                break;
            default:
                alert(`Cannot edit an event of type '${props?.type}' directly from the calendar.`);
                break;
        }
    }, []);

    // When a blank date on the calendar is clicked, open the general "Manage Entries" modal.
    const handleDateClick = useCallback((dateClickInfo) => {
        setActiveModal('manageEntries');
    }, []);

    // === RENDER LOGIC ===
    const isCurrentlyLoading = isLoadingEvents || isLoadingCourses;

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>Timetable Management Console</Typography>
            
            {/* A global loading bar for the page. */}
            <Box sx={{ height: 4, mb: 3 }}>
                {isCurrentlyLoading && <LinearProgress />}
            </Box>

            {eventsError && <Alert severity="error" sx={{ mb: 2 }}>{`Calendar data error: ${eventsError}`}</Alert>}

            {/* The main row of action buttons to open the different management modals. */}
            <Stack direction="row" spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" onClick={() => setActiveModal('manageEntries')} disabled={isCurrentlyLoading}>Manage Calendar Entries</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseDef')} disabled={isCurrentlyLoading}>Manage Courses</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseMeetings')} disabled={isCurrentlyLoading}>Manage Meetings</Button>
                <Button variant="contained" onClick={() => setActiveModal('entities')} disabled={isCurrentlyLoading}>Manage Entities</Button>
            </Stack>

            {/* Improved rendering logic: Show the skeleton only on the initial load. */}
            {isCurrentlyLoading && adminCalendarEvents.length === 0 ? (
                <CalendarSkeleton />
            ) : (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: 1 }}>
                    <FullCalendarView events={adminCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                </Box>
            )}

            {/* --- All Modals --- */}
            {/* The modals are "rendered" here, but they are only visible if their corresponding `activeModal` state is set. */}
            {/* This is a clean way to manage multiple potential modals from a single parent component. */}
            {activeModal === 'manageEntries' && ( <TimeTableCalendarManageModal open={true} onClose={handleCloseModals} onSave={handleSaveSuccess} /> )}
            {activeModal === 'editEntry' && ( <TimeTableEditModal open={true} onClose={handleCloseModals} onSave={handleSaveSuccess} initialData={modalData} /> )}
            <EntitiesManageModal open={activeModal === 'entities'} onClose={handleCloseModals} onSaveSuccess={handleSaveSuccess} />
            <ManageCourseDefinitionModal open={activeModal === 'courseDef'} onClose={handleCloseModals} onSaveSuccess={handleSaveSuccess} existingCourses={allCourses} isLoadingCourses={isLoadingCourses} />
            <ManageCourseMeetingsModal
                open={activeModal === 'courseMeetings'}
                onClose={handleCloseModals}
                onSaveSuccess={handleSaveSuccess}
                existingCourses={allCourses}
                isLoadingCourses={isLoadingCourses}
                initialCourseCode={modalData?.courseCode}
                initialMeetingId={modalData?.id}
            />
        </Box>
    );
}