import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, Stack, CircularProgress, Typography, Box, Alert, Skeleton, LinearProgress, Paper } from "@mui/material"; // ✨ 1. הוספת ייבוא

// ייבוא כל המודאלים הנדרשים
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import TimeTableEditModal from "../../components/modals/TimeTableEditModal";
import EntitiesManageModal from "../../components/modals/EntitiesManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
import ManageCourseMeetingsModal from "../../components/modals/ManageCourseMeetingsModal";

import { useEvents } from "../../context/EventsContext";
import { fetchCollection } from "../../firebase/firestoreService";

// ✨ 2. קומפוננטת עזר להצגת שלד של לוח השנה
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

export default function TimeTableManagementPage() {
    // === STATE MANAGEMENT ===
    const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
    const [allCourses, setAllCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);

    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState(null);

    // === DATA FETCHING ===
    const loadCourseList = useCallback(async () => {
        setIsLoadingCourses(true);
        try {
            setAllCourses(await fetchCollection("courses") || []);
        } catch (err) { console.error("Error loading course list:", err);
        } finally { setIsLoadingCourses(false); }
    }, []);

    useEffect(() => {
        loadCourseList();
    }, [loadCourseList]);

    const adminCalendarEvents = useMemo(() => {
        return allVisibleEvents.filter(event => event.extendedProps?.type !== 'studentEvent');
    }, [allVisibleEvents]);

    // === HANDLERS ===
    const handleCloseModals = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
    }, []);

    const handleSaveSuccess = useCallback(() => {
        handleCloseModals();
        refreshEvents();
        loadCourseList();
    }, [refreshEvents, loadCourseList, handleCloseModals]);
    
    const handleEventClick = useCallback((clickInfo) => {
        const event = clickInfo.event;
        const props = event.extendedProps;

        switch (props?.type) {
            case 'courseMeeting':
                setModalData(props);
                setActiveModal('courseMeetings');
                break;
            case 'holiday': case 'vacation': case 'event': case 'task': case 'yearMarker': case 'semesterMarker':
                {
                    let recordType = props.type;
                    if (props.type === 'yearMarker') recordType = 'year';
                    if (props.type === 'semesterMarker') recordType = 'semester';
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

    const handleDateClick = useCallback((dateClickInfo) => {
        setActiveModal('manageEntries');
    }, []);

    // === RENDER LOGIC ===
    const isCurrentlyLoading = isLoadingEvents || isLoadingCourses;

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>Timetable Management Console</Typography>
            
            {/* ✨ 3. LinearProgress גלובלי לעמוד */}
            <Box sx={{ height: 4, mb: 3 }}>
                {isCurrentlyLoading && <LinearProgress />}
            </Box>

            {eventsError && <Alert severity="error" sx={{ mb: 2 }}>{`Calendar data error: ${eventsError}`}</Alert>}

            <Stack direction="row" spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" onClick={() => setActiveModal('manageEntries')} disabled={isCurrentlyLoading}>Manage Calendar Entries</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseDef')} disabled={isCurrentlyLoading}>Manage Courses</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseMeetings')} disabled={isCurrentlyLoading}>Manage Meetings</Button>
                <Button variant="contained" onClick={() => setActiveModal('entities')} disabled={isCurrentlyLoading}>Manage Entities</Button>
            </Stack>

            {/* ✨ 4. לוגיקת תצוגה משופרת */}
            {isCurrentlyLoading && adminCalendarEvents.length === 0 ? (
                <CalendarSkeleton />
            ) : (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: 1 }}>
                    <FullCalendarView events={adminCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                </Box>
            )}

            {/* --- All Modals --- */}
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