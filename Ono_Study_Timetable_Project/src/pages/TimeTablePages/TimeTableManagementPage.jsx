// src/pages/TimeTablePages/TimeTableManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
// ✅ Import necessary icons
import { Add as AddIcon, Settings as SettingsIcon, School as SchoolIcon } from '@mui/icons-material';
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
// ✅ Import the new Course Definition Modal
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
import { getRecords } from "../../utils/storage";
import { formatDateTime, getExclusiveEndDate } from '../../utils/eventFormatters';

// --- Helper Functions & Constants ---
let lecturersMapCache = null;
const getLecturersMap = () => {
    if (lecturersMapCache) return lecturersMapCache;
    console.log("[ManagementPage:getLecturersMap] Creating lecturers map...");
    try {
        const lecturers = getRecords("lecturers") || [];
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) { /* ... error handling ... */ }
};


// --- ✅ Expanded and Diversified Color Definitions ---

// For background colors of events (or 'color' for non-block, timed events)
const EVENT_COLORS = {
    courseMeeting: '#42a5f5', // Lighter Blue
    event: '#ab47bc',         // Purple
    holiday: '#ef9a9a',       // Light Red (for block background)
    vacation: '#fff59d',     // Light Yellow (for block background)
    task: '#ffa726',          // Orange
    yearMarker: '#a5d6a7',    // Light Green (for block background)
    semesterMarker: '#81d4fa', // Light Blue (for block background)
    studentEvent: '#4db6ac', // Teal
    default: '#bdbdbd'       // Medium Grey
};

// Text colors ensuring good contrast with the backgrounds above
const EVENT_TEXT_COLORS = {
    courseMeeting: '#000000', // Black on Lighter Blue
    event: '#ffffff',         // White on Purple
    holiday: '#b71c1c',       // Dark Red on Light Red
    vacation: '#5d4037',     // Dark Brown on Light Yellow
    task: '#000000',          // Black on Orange
    yearMarker: '#1b5e20',    // Dark Green on Light Green
    semesterMarker: '#01579b', // Dark Blue on Light Blue
    studentEvent: '#ffffff',  // White on Teal
    default: '#000000'        // Black on Grey
};

// --- Main Component ---
export default function TimeTableManagementPage() {
    // --- State ---
    const [allCalendarEvents, setAllCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // ✅ State for existing course definitions (needed for validation in course modal)
    const [existingCourses, setExistingCourses] = useState([]);

    // State for the main Add/Edit Calendar Events modal flow
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedEventDataForModal, setSelectedEventDataForModal] = useState(null);
    const [selectedRecordTypeForModal, setSelectedRecordTypeForModal] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);

    // State for the nested "Manage Entities" dialog
    const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);

    // ✅ State for the Course Definition modal flow
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null); // For future edit functionality

    const lecturersMap = useMemo(() => getLecturersMap(), []);

    // --- Data Fetching (Calendar Events AND Course Definitions) ---
    // Renamed to loadData as it now loads more than just calendar events
// src/pages/TimeTablePages/TimeTableManagementPage.jsx

// ... (imports, helpers, constants, state definition) ...

    // --- Data Fetching and Formatting Logic ---
    const loadData = useCallback(() => {
        console.log("[ManagementPage:loadData] Loading ALL data (Events & Courses)...");
        setIsLoading(true);
        setError(null); // Clear previous errors

        try {
            // 1. Load Course Definitions (Needed for validation in Course Modal)
            const courses = getRecords("courses") || [];
            setExistingCourses(courses);
            console.log(`[ManagementPage:loadData] Loaded ${courses.length} course definitions.`);

            // 2. Prepare array for formatted calendar events
            const combinedEvents = [];
            const currentLecturersMap = getLecturersMap(); // Get the current map

            // 3. Format Course Meetings
            try {
                const rawMeetings = getRecords("coursesMeetings") || [];
                console.log(`[ManagementPage:loadData] Raw meetings count: ${rawMeetings.length}`);
                const formattedMeetings = rawMeetings.map((meeting) => {
                    const start = formatDateTime(meeting.date, meeting.startHour);
                    const end = formatDateTime(meeting.date, meeting.endHour);
                    if (!start || !end) { console.warn(`Skipping meeting ${meeting.id} due to invalid date/time.`); return null; }
                    const lecturerName = currentLecturersMap.get(meeting.lecturerId);
                    const color = EVENT_COLORS.courseMeeting;
                    return {
                        id: meeting.id,
                        title: `${meeting.courseName || 'Meeting'}`, // Keep title simple
                        start, end, allDay: false, color, borderColor: color,
                        classNames: ['fc-event-course-meeting'],
                        extendedProps: { ...meeting, type: "courseMeeting", recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null }
                    };
                }).filter(Boolean); // Remove nulls from failed formatting
                combinedEvents.push(...formattedMeetings);
                console.log(`[ManagementPage:loadData] Formatted ${formattedMeetings.length} course meetings.`);
            } catch (err) { console.error("Error formatting meetings:", err); /* Continue loading others */ }

            // 4. Format General Events
            try {
                const rawGeneralEvents = getRecords("events") || [];
                console.log(`[ManagementPage:loadData] Raw general events count: ${rawGeneralEvents.length}`);
                const formattedGeneralEvents = rawGeneralEvents.map((event) => {
                    const isAllDay = String(event.allDay).toLowerCase() === 'true';
                    const start = isAllDay ? event.startDate : formatDateTime(event.startDate, event.startHour);
                    const end = isAllDay ? getExclusiveEndDate(event.startDate, event.endDate) : formatDateTime(event.endDate || event.startDate, event.endHour || event.startHour);
                    if (!start) { console.warn(`Skipping event ${event.eventCode} due to invalid start.`); return null; }
                    const color = EVENT_COLORS.event;
                    return {
                        id: event.eventCode, title: event.eventName || 'Event', start,
                        end: isAllDay ? end : (end || start), allDay: isAllDay,
                        color, borderColor: color, classNames: ['fc-event-general'],
                        extendedProps: { ...event, type: "event", recordTypeForModal: "event" }
                    };
                }).filter(Boolean);
                combinedEvents.push(...formattedGeneralEvents);
                console.log(`[ManagementPage:loadData] Formatted ${formattedGeneralEvents.length} general events.`);
            } catch (err) { console.error("Error formatting general events:", err); }

            // 5. Format Holidays
            try {
                const rawHolidays = getRecords("holidays") || [];
                console.log(`[ManagementPage:loadData] Raw holidays count: ${rawHolidays.length}`);
                const formattedHolidays = rawHolidays.map((holiday) => {
                    if (!holiday.holidayCode || !holiday.startDate) return null;
                    const exclusiveEnd = getExclusiveEndDate(holiday.startDate, holiday.endDate);
                    const bgColor = EVENT_COLORS.holiday; const textColor = EVENT_TEXT_COLORS.holiday;
                    return {
                        id: holiday.holidayCode, title: holiday.holidayName || 'Holiday', start: holiday.startDate, end: exclusiveEnd,
                        allDay: true, display: 'block', backgroundColor: bgColor, borderColor: bgColor, textColor: textColor || EVENT_TEXT_COLORS.default,
                        classNames: ['fc-event-block', 'fc-event-holiday'],
                        extendedProps: { ...holiday, type: 'holiday', recordTypeForModal: 'holiday' }
                    };
                }).filter(Boolean);
                combinedEvents.push(...formattedHolidays);
                 console.log(`[ManagementPage:loadData] Formatted ${formattedHolidays.length} holidays.`);
            } catch (err) { console.error("Error formatting holidays:", err); }

            // 6. Format Vacations
             try {
                const rawVacations = getRecords("vacations") || [];
                console.log(`[ManagementPage:loadData] Raw vacations count: ${rawVacations.length}`);
                const formattedVacations = rawVacations.map((vacation) => {
                    if (!vacation.vacationCode || !vacation.startDate) return null;
                    const exclusiveEnd = getExclusiveEndDate(vacation.startDate, vacation.endDate);
                    const bgColor = EVENT_COLORS.vacation; const textColor = EVENT_TEXT_COLORS.vacation;
                    return {
                        id: vacation.vacationCode, title: vacation.vacationName || 'Vacation', start: vacation.startDate, end: exclusiveEnd,
                        allDay: true, display: 'block', backgroundColor: bgColor, borderColor: bgColor, textColor: textColor || EVENT_TEXT_COLORS.default,
                        classNames: ['fc-event-block', 'fc-event-vacation'],
                        extendedProps: { ...vacation, type: 'vacation', recordTypeForModal: 'vacation' }
                    };
                }).filter(Boolean);
                combinedEvents.push(...formattedVacations);
                 console.log(`[ManagementPage:loadData] Formatted ${formattedVacations.length} vacations.`);
            } catch (err) { console.error("Error formatting vacations:", err); }


            // 7. Format Year & Semester Markers (Background Display)
             try {
                const years = getRecords("years") || [];
                 console.log(`[ManagementPage:loadData] Raw years count: ${years.length}`);
                const markerEvents = years.flatMap((year) => {
                    if (!year.yearCode || !year.startDate || !year.endDate) return []; // Skip invalid year entries
                    const yearColor = EVENT_COLORS.yearMarker; const semesterColor = EVENT_COLORS.semesterMarker;
                    const markers = [];
                    // Year Start/End Markers
                    markers.push({ id: `y-start-${year.yearCode}`, title: `Y${year.yearNumber} Start`, start: year.startDate, allDay: true, display: 'block', color: yearColor, classNames: ['fc-event-marker'], extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } });
                    markers.push({ id: `y-end-${year.yearCode}`, title: `Y${year.yearNumber} End`, start: year.endDate, allDay: true, display: 'block', color: yearColor, classNames: ['fc-event-marker'], extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } });
                    // Semester Start/End Markers
                    (year.semesters || []).forEach((s) => {
                         if (!s.semesterCode || !s.startDate || !s.endDate) return;
                         const semData = { ...s, yearCode: year.yearCode };
                         markers.push({ id: `s-start-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} Start`, start: s.startDate, allDay: true, display: 'block', color: semesterColor, classNames: ['fc-event-marker'], extendedProps: { ...semData, type: 'semesterMarker', recordTypeForModal: 'semester' } });
                         markers.push({ id: `s-end-${s.semesterCode}`, title: `S${s.semesterNumber}/Y${year.yearNumber} End`, start: s.endDate, allDay: true, display: 'block', color: semesterColor, classNames: ['fc-event-marker'], extendedProps: { ...semData, type: 'semesterMarker', recordTypeForModal: 'semester' } });
                    });
                    return markers;
                }).filter(Boolean);
                combinedEvents.push(...markerEvents);
                 console.log(`[ManagementPage:loadData] Formatted ${markerEvents.length} year/semester markers.`);
            } catch (err) { console.error("Error formatting markers:", err); }

            // 8. Format Tasks
            try {
                const rawTasks = getRecords("tasks") || [];
                 console.log(`[ManagementPage:loadData] Raw tasks count: ${rawTasks.length}`);
                const formattedTasks = rawTasks.map(task => {
                     if (!task.assignmentCode || !task.submissionDate) return null;
                     const start = formatDateTime(task.submissionDate, task.submissionHour || '23:59'); // Time the task is due
                     if (!start) return null;
                     const color = EVENT_COLORS.task; const textColor = EVENT_TEXT_COLORS.task;
                     return {
                         id: task.assignmentCode, title: `Due: ${task.assignmentName || 'Task'}`, start, allDay: false, // Show as timed event at deadline
                         color, borderColor: color, textColor: textColor || EVENT_TEXT_COLORS.default,
                         classNames: ['fc-event-task'],
                         extendedProps: { ...task, type: 'task', recordTypeForModal: 'task' }
                     };
                }).filter(Boolean);
                combinedEvents.push(...formattedTasks);
                 console.log(`[ManagementPage:loadData] Formatted ${formattedTasks.length} tasks.`);
            } catch (err) { console.error("Error formatting tasks:", err); }


            // 9. Update the state with all combined events
            setAllCalendarEvents(combinedEvents);
            console.log(`[ManagementPage:loadData] Total formatted events set to state: ${combinedEvents.length}`);

        } catch (err) { // Catch errors from getRecords or general processing
            console.error("[ManagementPage:loadData] Overall error loading data:", err);
            setError("Failed to load required page data. Please check storage or refresh.");
            setAllCalendarEvents([]); // Ensure calendar is empty on error
            setExistingCourses([]);
        } finally {
            setIsLoading(false); // Ensure loading is always set to false
            console.log("[ManagementPage:loadData] Finished.");
        }
    // Dependency: Include getLecturersMap result if it could change,
    // but since we use cache, loadData itself is stable.
    }, [lecturersMap]); // Keep dependency minimal, rely on external triggers for refresh

    // Initial data load effect
    useEffect(() => {
        loadData();
    }, [loadData]); // Load on mount

    // --- Calendar Interaction Handlers ---
    const handleDateClick = useCallback((info) => {
        // Opens the general calendar entry add modal
        setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null);
        setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
        setIsCalendarModalOpen(true);
    }, []);

    const handleEventClick = useCallback((info) => {
        const clickedEvent = info.event;
        const props = clickedEvent.extendedProps;
        console.log(`[ManagementPage] Event clicked: ID=${clickedEvent.id}, Type=${props?.type}, RecordTypeForModal=${props?.recordTypeForModal}`);
        console.log(`[handleEventClick] Clicked Event ID: ${clickedEvent.id}`);
        console.log(`[handleEventClick] extendedProps (props):`, props);
        console.log(`[handleEventClick] props.recordTypeForModal:`, props?.recordTypeForModal);
        if (!props || !props.recordTypeForModal) {
            console.warn("[ManagementPage] Clicked event missing critical extendedProps. Cannot edit.");
            alert("Cannot edit this event: Missing required internal data.");
            return;
        }
        if (props.type === 'studentEvent') {
            console.log("[ManagementPage] Clicked on a student's personal event. Editing disabled on this page.");
            alert(`Student Event: ${clickedEvent.title}\n(Cannot be edited from the management page)`);
            return;
        }

        else if (props.recordTypeForModal === 'semester') {
          console.log('[handleEventClick] SEMESTER CLICK DETECTED. Preparing to open EDIT modal.');
     } else {
          console.log('[handleEventClick] OTHER EDITABLE EVENT CLICK DETECTED. Preparing to open EDIT modal.');
     }

        setSelectedEventDataForModal(props);
        setSelectedRecordTypeForModal(props.recordTypeForModal);
        setModalDefaultDate(null);
        setIsCalendarModalOpen(true);
    }, []);

    // --- Modal Control Handlers ---
    const handleCloseCalendarModal = useCallback(() => {
        setIsCalendarModalOpen(false);
        setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null); setModalDefaultDate(null);
    }, []);

    // Handler to open the Course Definition modal
    const handleOpenCourseModal = (courseData = null) => { // Accepts optional data for editing
        setCourseToEdit(courseData);
        setIsCourseModalOpen(true);
    };

    const handleCloseCourseModal = useCallback(() => {
        setIsCourseModalOpen(false);
        setCourseToEdit(null);
    }, []);

    // Generic success handler called by ANY modal on successful save/delete
    const handleSuccessfulSaveOrDelete = useCallback(() => {
        console.log("[ManagementPage] Received successful save/delete signal. Reloading data...");
        // Close all potentially open modals
        if (isCalendarModalOpen) handleCloseCalendarModal();
        if (isCourseModalOpen) handleCloseCourseModal(); // ✅ Close course modal too
        if (isManageEntitiesModalOpen) setIsManageEntitiesModalOpen(false);
        loadData(); // Trigger full data reload
    }, [handleCloseCalendarModal, handleCloseCourseModal, isCalendarModalOpen, isCourseModalOpen, isManageEntitiesModalOpen, loadData]); // Added course modal state dependency

    // --- Render Logic ---
    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Timetable Management Console
            </Typography>

            {/* Action Buttons Row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                {/* Add generic calendar entry (event, holiday, task, etc.) */}
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setIsCalendarModalOpen(true); setSelectedEventDataForModal(null); /* ... */ }} sx={{ whiteSpace: 'nowrap' }}>
                    Add Calendar Entry
                </Button>
                {/* Manage Course Definitions */}
                <Button variant="contained" color="success" startIcon={<SchoolIcon />} onClick={() => handleOpenCourseModal(null)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Courses
                </Button>
                {/* Manage Basic Entities */}
                <Button variant="contained" color="secondary" startIcon={<SettingsIcon />} onClick={() => setIsManageEntitiesModalOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Entities
                </Button>
            </Stack>

            {/* Error Display */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Loading or Calendar */}
            {isLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}> <CircularProgress /> </Box> )
                       : ( <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: { xs: 0.5, sm: 1 } }}>
                              <FullCalendarView events={allCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                           </Box> )}

            {/* --- Modals --- */}
            {/* Modal Controller for generic calendar entries & basic entities */}
            <TimeTableCalendarManageModal
                open={isCalendarModalOpen}
                onClose={handleCloseCalendarModal}
                onSave={handleSuccessfulSaveOrDelete} // Generic refresh
                initialData={selectedEventDataForModal}
                recordType={selectedRecordTypeForModal}
                defaultDate={modalDefaultDate}
                manageEntitiesOpen={isManageEntitiesModalOpen}
                setManageEntitiesOpen={setIsManageEntitiesModalOpen}
            />

            {/* ✅ Modal for Course Definitions */}
            <ManageCourseDefinitionModal
                open={isCourseModalOpen}
                onClose={handleCloseCourseModal}
                onSaveSuccess={handleSuccessfulSaveOrDelete} // Generic refresh
                initialData={courseToEdit}        // For future editing
                existingCourses={existingCourses} // For validation
            />
        </Box>
    );
}