import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import EntitiesManageModal from "../../components/modals/EntitiesManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
import ManageCourseMeetingsModal from "../../components/modals/ManageCourseMeetingsModal";
import { useEvents } from "../../context/EventsContext";
import { fetchCollection } from "../../firebase/firestoreService";

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
    
    // --- ✨ לוגיקה חדשה, פשוטה ואמינה לפתיחת מודאלים ---
    
    // פונקציה לפתיחת מודאל הוספה
    const openAddModal = (defaultDate = null) => {
        setModalData({ isEditing: false, defaultDate: defaultDate });
        setActiveModal('generic');
    };

    // פונקציה לפתיחת מודאל עריכה
    const openEditModal = (eventData) => {
        // ודא שה-type הנכון נמצא בנתונים
        let recordType = eventData.type;
        if (eventData.type === 'yearMarker') recordType = 'year';
        if (eventData.type === 'semesterMarker') recordType = 'semester';
        
        setModalData({ isEditing: true, data: { ...eventData, type: recordType } });
        setActiveModal('generic');
    };

    const handleEventClick = useCallback((clickInfo) => {
        const props = clickInfo.event.extendedProps;
        console.log("Event clicked:", props);

        switch (props?.type) {
            case 'courseMeeting':
                setModalData(props); // נתונים למודאל פגישות
                setActiveModal('courseMeetings');
                break;
            
            // כל אלו יפתחו את מודאל העריכה הגנרי
            case 'holiday':
            case 'vacation':
            case 'event':
            case 'task':
            case 'yearMarker': // שם הסוג מ-getAllVisibleEvents
            case 'semesterMarker': // שם הסוג מ-getAllVisibleEvents
                openEditModal(props);
                break;

            default:
                alert(`Cannot edit '${props.type}' from the calendar.`);
                break;
        }
    }, []);

    const handleDateClick = useCallback((dateClickInfo) => {
        openAddModal(dateClickInfo.dateStr);
    }, []);

    // === RENDER LOGIC ===
    const isCurrentlyLoading = isLoadingEvents || isLoadingCourses;

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>Timetable Management Console</Typography>
            {eventsError && <Alert severity="error" sx={{ mb: 2 }}>{`Calendar data error: ${eventsError}`}</Alert>}

            <Stack direction="row" spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" onClick={() => openAddModal(new Date().toISOString().split('T')[0])}>Add Entry</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseDef')}>Manage Courses</Button>
                <Button variant="contained" onClick={() => setActiveModal('courseMeetings')}>Manage Meetings</Button>
                <Button variant="contained" onClick={() => setActiveModal('entities')}>Manage Entities</Button>
            </Stack>

            {isCurrentlyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
            ) : (
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: 1 }}>
                    <FullCalendarView events={adminCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                </Box>
            )}

            {/* --- All Modals --- */}
            
            {/* ✨ --- קריאה פשוטה וברורה למודאל הגנרי --- ✨ */}
            {activeModal === 'generic' && (
                <TimeTableCalendarManageModal
                    open={true}
                    onClose={handleCloseModals}
                    onSave={handleSaveSuccess}
                    // המודאל יקבל את כל הנתונים ויחליט בעצמו אם להציג הוספה או עריכה
                    initialData={modalData?.data}
                    defaultDate={modalData?.defaultDate}
                />
            )}
            
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