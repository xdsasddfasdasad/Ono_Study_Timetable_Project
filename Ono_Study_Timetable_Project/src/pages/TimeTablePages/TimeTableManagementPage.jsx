import React, { useState, useEffect, useCallback } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon, School as SchoolIcon } from '@mui/icons-material';
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
import { fetchCollection } from "../../firebase/firestoreService"; // Use Firestore service
import { formatDateTime, getExclusiveEndDate } from '../../utils/eventFormatters';

// --- Helper Function to fetch and create Lecturers Map (Async) ---
// Keep cache to avoid re-fetching if component re-renders for other reasons
let lecturersMapCache = null;
const getLecturersMapAsync = async () => {
    if (lecturersMapCache) return lecturersMapCache;
    console.log("[ManagementPage:getLecturersMapAsync] Creating lecturers map from Firestore...");
    try {
        const lecturers = await fetchCollection("lecturers");
        lecturersMapCache = new Map((lecturers || []).map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("[ManagementPage:getLecturersMapAsync] Error:", error);
         lecturersMapCache = new Map(); // Return empty on error but still cache it
         return lecturersMapCache;
    }
};

// --- Color Definitions (Consider moving to a central theme/config) ---
const EVENT_COLORS = { courseMeeting: '#42a5f5', event: '#ab47bc', holiday: '#ef9a9a', vacation: '#fff59d', task: '#ffa726', yearMarker: '#a5d6a7', semesterMarker: '#81d4fa', studentEvent: '#4db6ac', default: '#bdbdbd' };
const EVENT_BORDERS = { courseMeeting: '#1e88e5', event: '#8e24aa', holiday: '#e57373', vacation: '#ffee58', task: '#fb8c00', yearMarker: '#66bb6a', semesterMarker: '#29b6f6', studentEvent: '#26a69a', default: '#9e9e9e' };
const EVENT_TEXT_COLORS = { courseMeeting: '#000000', event: '#ffffff', holiday: '#b71c1c', vacation: '#5d4037', task: '#000000', yearMarker: '#1b5e20', semesterMarker: '#01579b', studentEvent: '#ffffff', default: '#000000' };

// --- Main Page Component ---
export default function TimeTableManagementPage() {
    // --- State Definitions ---
    const [allCalendarEvents, setAllCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [existingCourses, setExistingCourses] = useState([]);
    const [lecturersMap, setLecturersMap] = useState(new Map()); // State for the loaded map

    // Modal States
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedEventDataForModal, setSelectedEventDataForModal] = useState(null);
    const [selectedRecordTypeForModal, setSelectedRecordTypeForModal] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null); // For editing a course definition

    // --- Data Loading and Formatting Function ---
    const loadData = useCallback(async () => {
        console.log("[ManagementPage:loadData] Loading ALL data from Firestore...");
        setIsLoading(true); setError(null);
        try {
            // Fetch all necessary collections in parallel
            const [
                coursesData, meetingsData, eventsData, holidaysData,
                vacationsData, yearsData, tasksData, currentLecturersMap
            ] = await Promise.all([
                fetchCollection("courses"),
                fetchCollection("coursesMeetings"),
                fetchCollection("events"),
                fetchCollection("holidays"),
                fetchCollection("vacations"),
                fetchCollection("years"),
                fetchCollection("tasks"),
                getLecturersMapAsync() // Fetch (or get from cache) the lecturers map
            ]);

            setExistingCourses(coursesData || []);
            setLecturersMap(currentLecturersMap || new Map()); // Set the loaded map to state
            console.log(`[ManagementPage:loadData] Loaded ${coursesData?.length || 0} course definitions.`);

            const combinedEvents = [];

            // Format Meetings
            (meetingsData || []).forEach(m => {
                const start = formatDateTime(m.date, m.startHour); const end = formatDateTime(m.date, m.endHour); if (!start || !end) return;
                const lecturerName = currentLecturersMap.get(m.lecturerId);
                const type = 'courseMeeting';
                combinedEvents.push({ id: m.id, title: `${m.courseName || 'Meeting'}`, start, end, allDay: false, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-course-meeting'], extendedProps: { ...m, type, recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null } });
            });

            // Format General Events
            (eventsData || []).forEach(e => {
                const type = 'event'; const isAllDay = String(e.allDay).toLowerCase() === 'true';
                const start = isAllDay ? e.startDate : formatDateTime(e.startDate, e.startHour);
                const end = isAllDay ? getExclusiveEndDate(e.startDate, e.endDate) : formatDateTime(e.endDate || e.startDate, e.endHour || e.startHour);
                if (!start) return;
                combinedEvents.push({ id: e.eventCode, title: e.eventName || 'Event', start, end: isAllDay ? end : (end || start), allDay: isAllDay, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-general'], extendedProps: { ...e, type, recordTypeForModal: "event" } });
            });

            // Format Holidays
            (holidaysData || []).forEach(h => {
                if (!h.holidayCode || !h.startDate) return; const type = 'holiday'; const exclusiveEnd = getExclusiveEndDate(h.startDate, h.endDate);
                combinedEvents.push({ id: h.holidayCode, title: h.holidayName || 'Holiday', start: h.startDate, end: exclusiveEnd, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-block', 'fc-event-holiday'], extendedProps: { ...h, type, recordTypeForModal: 'holiday' } });
            });

            // Format Vacations
            (vacationsData || []).forEach(v => {
                if (!v.vacationCode || !v.startDate) return; const type = 'vacation'; const exclusiveEnd = getExclusiveEndDate(v.startDate, v.endDate);
                combinedEvents.push({ id: v.vacationCode, title: v.vacationName || 'Vacation', start: v.startDate, end: exclusiveEnd, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-block', 'fc-event-vacation'], extendedProps: { ...v, type, recordTypeForModal: 'vacation' } });
            });

            // Format Year & Semester Markers (as Block events)
            (yearsData || []).forEach(year => {
                if (!year.yearCode || !year.startDate || !year.endDate) return;
                const yType = 'yearMarker'; const sType = 'semesterMarker';
                combinedEvents.push({ id: `y-start-${year.yearCode}`, title: `Y${year.yearNumber} Start`, start: year.startDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[yType], borderColor: EVENT_BORDERS[yType], textColor: EVENT_TEXT_COLORS[yType], classNames: ['fc-event-marker', 'fc-event-block-marker'], extendedProps: { ...year, type: yType, recordTypeForModal: 'year' } });
                combinedEvents.push({ id: `y-end-${year.yearCode}`, title: `Y${year.yearNumber} End`, start: year.endDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[yType], borderColor: EVENT_BORDERS[yType], textColor: EVENT_TEXT_COLORS[yType], classNames: ['fc-event-marker', 'fc-event-block-marker'], extendedProps: { ...year, type: yType, recordTypeForModal: 'year' } });
                (year.semesters || []).forEach(s => {
                     if (!s.semesterCode || !s.startDate || !s.endDate) return; const semData = { ...s, yearCode: year.yearCode };
                     combinedEvents.push({ id: `s-start-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} Start`, start: s.startDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[sType], borderColor: EVENT_BORDERS[sType], textColor: EVENT_TEXT_COLORS[sType], classNames: ['fc-event-marker', 'fc-event-block-marker'], extendedProps: { ...semData, type: sType, recordTypeForModal: 'semester' } });
                     combinedEvents.push({ id: `s-end-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} End`, start: s.endDate, allDay: true, display: 'block', backgroundColor: EVENT_COLORS[sType], borderColor: EVENT_BORDERS[sType], textColor: EVENT_TEXT_COLORS[sType], classNames: ['fc-event-marker', 'fc-event-block-marker'], extendedProps: { ...semData, type: sType, recordTypeForModal: 'semester' } });
                });
            });

            // Format Tasks
            (tasksData || []).forEach(t => {
                 if (!t.assignmentCode || !t.submissionDate) return; const type = 'task'; const start = formatDateTime(t.submissionDate, t.submissionHour || '23:59'); if (!start) return;
                 combinedEvents.push({ id: t.assignmentCode, title: `Due: ${t.assignmentName || 'Task'}`, start, allDay: false, color: EVENT_COLORS[type], borderColor: EVENT_BORDERS[type], textColor: EVENT_TEXT_COLORS[type], classNames: ['fc-event-task'], extendedProps: { ...t, type, recordTypeForModal: 'task'} });
            });

            setAllCalendarEvents(combinedEvents);
            console.log(`[ManagementPage:loadData] Total events formatted: ${combinedEvents.length}`);
        } catch (err) {
            console.error("[ManagementPage:loadData] Overall error:", err);
            setError("Failed to load timetable data. Please try refreshing.");
            setAllCalendarEvents([]); setExistingCourses([]); setLecturersMap(new Map());
        } finally {
            setIsLoading(false);
        }
    }, []); // No explicit dependencies as it fetches all on call, relies on refresh trigger

    // --- useEffect for initial data load ---
    useEffect(() => { loadData(); }, [loadData]);

    // --- Event Handlers for Calendar Interactions ---
    const handleDateClick = useCallback((info) => {
        setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null);
        setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
        setIsCalendarModalOpen(true); // Opens the TimeTableCalendarManageModal
    }, []);

    const handleEventClick = useCallback((info) => {
        const props = info.event.extendedProps;
        if (!props || !props.recordTypeForModal || props.type === 'studentEvent') {
            if (props?.type !== 'studentEvent') alert("This event type is not directly editable here or has missing data.");
            return;
        }
        // Year/Semester markers are now editable block events
        setSelectedEventDataForModal(props);
        setSelectedRecordTypeForModal(props.recordTypeForModal);
        setModalDefaultDate(null);
        setIsCalendarModalOpen(true); // Opens TimeTableCalendarManageModal which routes to EditModal
    }, []);

    // --- Modal Control Handlers ---
    const handleCloseCalendarModal = useCallback(() => {
        setIsCalendarModalOpen(false); setSelectedEventDataForModal(null);
        setSelectedRecordTypeForModal(null); setModalDefaultDate(null);
    }, []);

    const handleOpenCourseModal = (courseData = null) => {
        setCourseToEdit(courseData); setIsCourseModalOpen(true);
    };
    const handleCloseCourseModal = useCallback(() => {
        setIsCourseModalOpen(false); setCourseToEdit(null);
    }, []);

    // Generic success handler after any Add/Edit/Delete from any modal
    const handleSuccessfulSaveOrDelete = useCallback(() => {
        console.log("[ManagementPage] Save/Delete successful. Reloading data...");
        if (isCalendarModalOpen) handleCloseCalendarModal();
        if (isCourseModalOpen) handleCloseCourseModal();
        if (isManageEntitiesModalOpen) setIsManageEntitiesModalOpen(false);
        loadData(); // Reload all data from Firestore
    }, [isCalendarModalOpen, isCourseModalOpen, isManageEntitiesModalOpen, loadData, handleCloseCalendarModal, handleCloseCourseModal]);


    // --- Render Logic ---
    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}> Timetable Management Console </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setIsCalendarModalOpen(true); setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null); setModalDefaultDate(new Date().toISOString().split('T')[0]); }} sx={{ whiteSpace: 'nowrap' }}> Add Calendar Entry </Button>
                <Button variant="contained" color="success" startIcon={<SchoolIcon />} onClick={() => handleOpenCourseModal(null)} sx={{ whiteSpace: 'nowrap' }}> Manage Courses </Button>
                <Button variant="contained" color="secondary" startIcon={<SettingsIcon />} onClick={() => setIsManageEntitiesModalOpen(true)} sx={{ whiteSpace: 'nowrap' }}> Manage Entities </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {isLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}> <CircularProgress /> <Typography sx={{ml:2}}>Loading Timetable Data...</Typography> </Box> )
                       : ( <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
                              <FullCalendarView events={allCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                           </Box> )}

            <TimeTableCalendarManageModal open={isCalendarModalOpen} onClose={handleCloseCalendarModal} onSave={handleSuccessfulSaveOrDelete} initialData={selectedEventDataForModal} recordType={selectedRecordTypeForModal} defaultDate={modalDefaultDate} manageEntitiesOpen={isManageEntitiesModalOpen} setManageEntitiesOpen={setIsManageEntitiesModalOpen} />
            <ManageCourseDefinitionModal open={isCourseModalOpen} onClose={handleCloseCourseModal} onSaveSuccess={handleSuccessfulSaveOrDelete} initialData={courseToEdit} existingCourses={existingCourses} />
        </Box>
    );
}