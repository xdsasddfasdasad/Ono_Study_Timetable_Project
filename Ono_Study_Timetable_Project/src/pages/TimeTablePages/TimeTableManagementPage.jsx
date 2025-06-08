// src/pages/TimeTableManagementPage.jsx

import React, { useState, useCallback } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
// --- FIX 1: Import the central EventsContext ---
import { useEvents } from "../../context/EventsContext";
import { fetchCollection } from "../../firebase/firestoreService"; // Keep for fetching courses for the modal

export default function TimeTableManagementPage() {
    // --- FIX 2: Consume data and functions from the context ---
    const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();

    // --- State for this page is now ONLY for controlling modals ---
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedEventData, setSelectedEventData] = useState(null);
    const [selectedRecordType, setSelectedRecordType] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [isManageEntitiesOpen, setIsManageEntitiesOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null);
    
    // State to hold course definitions specifically for the ManageCourseDefinitionModal
    const [existingCourses, setExistingCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);


    // --- Event Handlers for Calendar Interactions ---
    const handleDateClick = useCallback((info) => {
        setSelectedEventData(null);
        setSelectedRecordType(null);
        setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
        setIsCalendarModalOpen(true); // This opens the "Add" part of the manage modal
    }, []);

    const handleEventClick = useCallback((info) => {
        const props = info.event.extendedProps;
        // The recordType is now part of extendedProps from getAllVisibleEvents
        const recordTypeForModal = props?.type === 'courseMeeting' ? 'courseMeeting' : props?.type;

        if (!recordTypeForModal) {
            alert("This event cannot be edited.");
            return;
        }

        // The "Manage Courses" modal is used for 'course' type, not the generic edit modal.
        if (recordTypeForModal === 'course') {
            handleOpenCourseModal(props);
            return;
        }

        setSelectedEventData(props);
        setSelectedRecordType(recordTypeForModal);
        setModalDefaultDate(null);
        setIsCalendarModalOpen(true); // This opens the "Edit" part of the manage modal
    }, []);

    // --- Modal Control Handlers ---
    const handleCloseAllModals = () => {
        setIsCalendarModalOpen(false);
        setIsCourseModalOpen(false);
        setIsManageEntitiesOpen(false);
        setSelectedEventData(null);
        setSelectedRecordType(null);
        setModalDefaultDate(null);
        setCourseToEdit(null);
    };

    const handleOpenCourseModal = async (courseData = null) => {
        setCourseToEdit(courseData);
        setIsLoadingCourses(true);
        try {
            const courses = await fetchCollection("courses");
            setExistingCourses(courses || []);
        } catch (e) {
            console.error("Failed to fetch courses for modal", e);
            setExistingCourses([]);
        } finally {
            setIsLoadingCourses(false);
            setIsCourseModalOpen(true);
        }
    };
    
    // This single handler is called on successful save/delete from ANY modal
    const handleSaveSuccess = useCallback(() => {
        handleCloseAllModals();
        refreshEvents(); // Simply tell the context to refresh all data
    }, [refreshEvents]);


    // --- Main Render Logic ---
    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Timetable Management Console
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" color="primary" onClick={handleDateClick}>
                    Add Calendar Entry
                </Button>
                <Button variant="contained" color="secondary" onClick={() => handleOpenCourseModal(null)}>
                    Manage Courses
                </Button>
                <Button variant="outlined" onClick={() => setIsManageEntitiesOpen(true)}>
                    Manage Entities
                </Button>
            </Stack>

            {eventsError && <Alert severity="error" sx={{ mb: 2 }}>{`Error: ${eventsError}`}</Alert>}
            
            {isLoadingEvents ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                    <Typography sx={{ml:2}}>Loading Timetable Data...</Typography>
                </Box>
            ) : (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: 1 }}>
                    <FullCalendarView
                        events={allVisibleEvents}
                        onDateClick={handleDateClick}
                        onEventClick={handleEventClick}
                    />
                </Box>
            )}

            {/* --- Modals --- */}
            {(isCalendarModalOpen || isManageEntitiesOpen) && (
                <TimeTableCalendarManageModal
                    open={isCalendarModalOpen}
                    onClose={handleCloseAllModals}
                    onSave={handleSaveSuccess}
                    initialData={selectedEventData}
                    recordType={selectedRecordType}
                    defaultDate={modalDefaultDate}
                    manageEntitiesOpen={isManageEntitiesOpen}
                    setManageEntitiesOpen={setIsManageEntitiesOpen}
                />
            )}
            
            {isCourseModalOpen && (
                <ManageCourseDefinitionModal
                    open={isCourseModalOpen}
                    onClose={handleCloseAllModals}
                    onSaveSuccess={handleSaveSuccess}
                    initialData={courseToEdit}
                    existingCourses={existingCourses}
                    isLoadingCourses={isLoadingCourses}
                />
            )}
        </Box>
    );
}