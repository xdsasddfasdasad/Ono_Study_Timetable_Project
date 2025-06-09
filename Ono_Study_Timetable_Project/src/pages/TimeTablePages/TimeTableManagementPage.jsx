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

    // קוד פשוט: רק מסנן החוצה אירועים של סטודנטים. אין צורך לשנות את הנתונים.
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
    
    const openAddModal = (defaultDate = null) => {
        setModalData({ isEditing: false, defaultDate: defaultDate });
        setActiveModal('generic');
    };

    const openEditModal = (eventData) => {
        let recordType = eventData.type;
        if (eventData.type === 'yearMarker') recordType = 'year';
        if (eventData.type === 'semesterMarker') recordType = 'semester';
        
        setModalData({ isEditing: true, data: { ...eventData, type: recordType } });
        setActiveModal('generic');
    };
    
    // הלוגיקה הזו תמיד הייתה נכונה. היא מקבלת את האירוע, עם הסוג המקורי שלו,
    // ומעבירה אותו למודאל הנכון. כעת שהתצוגה תקינה, גם הפונקציונליות תעבוד.
    const handleEventClick = useCallback((clickInfo) => {
        const event = clickInfo.event;
        const props = event.extendedProps;

        switch (props?.type) {
            case 'courseMeeting':
                setModalData(props);
                setActiveModal('courseMeetings');
                break;
            
            case 'holiday':
            case 'vacation':
            case 'event':
            case 'task':
            case 'yearMarker':
            case 'semesterMarker':
                {
                    const dataForModal = {
                        ...props,
                        id: event.id,
                        title: event.title,
                        start: event.start,
                        end: event.end,
                        allDay: event.allDay,
                    };
                    openEditModal(dataForModal);
                }
                break;

            default:
                alert(`Cannot edit an event of type '${props?.type}' directly from the calendar.`);
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
            
            {activeModal === 'generic' && (
                <TimeTableCalendarManageModal
                    open={true}
                    onClose={handleCloseModals}
                    onSave={handleSaveSuccess}
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