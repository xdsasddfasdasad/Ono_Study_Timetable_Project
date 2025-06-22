import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";

// ייבוא כל המודאלים הנדרשים
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import TimeTableEditModal from "../../components/modals/TimeTableEditModal"; // ייבוא שהיה חסר
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

    // ✨ Handler אחיד להצלחה, יועבר לכל מודאל בפרופ onSave
    const handleSaveSuccess = useCallback(() => {
        handleCloseModals();
        refreshEvents();
        loadCourseList();
    }, [refreshEvents, loadCourseList, handleCloseModals]);
    
    // ✨ Handler לעריכה מהירה מתוך לוח השנה
    const handleEventClick = useCallback((clickInfo) => {
        const event = clickInfo.event;
        const props = event.extendedProps;

        switch (props?.type) {
            case 'courseMeeting':
                setModalData(props);
                setActiveModal('courseMeetings');
                break;
            
            // כל אירועי לוח השנה הניתנים לעריכה
            case 'holiday':
            case 'vacation':
            case 'event':
            case 'task':
            case 'yearMarker':
            case 'semesterMarker':
                {
                    // נכין את האובייקט המדויק עבור מודאל העריכה
                    let recordType = props.type;
                    if (props.type === 'yearMarker') recordType = 'year';
                    if (props.type === 'semesterMarker') recordType = 'semester';

                    const dataForModal = {
                        ...props,
                        type: recordType, // ודא שה-type הנכון מועבר
                        id: event.id,
                        title: event.title,
                        start: event.start,
                        end: event.end,
                        allDay: event.allDay,
                    };
                    setModalData(dataForModal);
                    setActiveModal('editEntry'); // פתיחת מודאל עריכה ישירה
                }
                break;

            default:
                alert(`Cannot edit an event of type '${props?.type}' directly from the calendar.`);
                break;
        }
    }, []);

    // לחיצה על תאריך פותחת כעת את מודאל הניהול הכללי
    const handleDateClick = useCallback((dateClickInfo) => {
        setActiveModal('manageEntries');
    }, []);

    // === RENDER LOGIC ===
    const isCurrentlyLoading = isLoadingEvents || isLoadingCourses;

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>Timetable Management Console</Typography>
            {eventsError && <Alert severity="error" sx={{ mb: 2 }}>{`Calendar data error: ${eventsError}`}</Alert>}

            <Stack direction="row" spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                {/* ✨ כפתור זה פותח את מודאל הניהול הראשי */}
                <Button variant="contained" onClick={() => setActiveModal('manageEntries')}>Manage Calendar Entries</Button>
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
            
            {/* ✨ 1. המודאל הראשי לניהול רשומות לוח שנה */}
            {activeModal === 'manageEntries' && (
                <TimeTableCalendarManageModal
                    open={true}
                    onClose={handleCloseModals}
                    onSave={handleSaveSuccess} // העברת הפרופ בשם הנכון
                />
            )}

            {/* ✨ 2. המודאל לעריכה מהירה ישירות מהקלנדר */}
            {activeModal === 'editEntry' && (
                <TimeTableEditModal
                    open={true}
                    onClose={handleCloseModals}
                    onSave={handleSaveSuccess} // העברת הפרופ בשם הנכון
                    initialData={modalData}
                />
            )}
            
            {/* שאר המודאלים נשארים ללא שינוי */}
            <EntitiesManageModal open={activeModal === 'entities'} onClose={handleCloseModals} onSaveSuccess={handleSaveSuccess} />
            <ManageCourseDefinitionModal open={activeModal === 'courseDef'} onClose={handleCloseModals} onSaveSuccess={handleSaveSuccess} existingCourses={allCourses} isLoadingCourses={isLoadingCourses} />
            <ManageCourseMeetingsModal
                open={activeModal === 'courseMeetings'}
                onClose={handleCloseModals}
                onSaveSuccess={handleSaveSuccess}
                // existingCourses={allCourses}
                // isLoadingCourses={isLoadingCourses}
                initialCourseCode={modalData?.courseCode}
                initialMeetingId={modalData?.id}
            />
        </Box>
    );
}