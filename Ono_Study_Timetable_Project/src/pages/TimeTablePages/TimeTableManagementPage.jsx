// src/pages/TimeTablePages/TimeTableManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import { getRecords } from "../../utils/storage";
import { formatDateTime, getExclusiveEndDate } from '../../utils/eventFormatters'; // Make sure path is correct

// --- Helper Functions & Constants --- (Consider moving to dedicated utils/config files)

// Cache for lecturers map
let lecturersMapCache = null;

// Helper to get lecturer names map
const getLecturersMap = () => {
    // Return cache if available
    if (lecturersMapCache) return lecturersMapCache;

    console.log("[ManagementPage:getLecturersMap] Creating lecturers map...");
    try {
        const lecturers = getRecords("lecturers") || [];
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("[ManagementPage:getLecturersMap] Error creating lecturers map:", error);
         lecturersMapCache = new Map(); // Return empty map on error
         return lecturersMapCache;
    }
};

// Define colors for different event types consistently
// (Consider moving to a theme or config file)
const EVENT_COLORS = {
    courseMeeting: '#3788d8', // Blue
    event: '#8884d8',         // Purple
    holiday: '#fa5252',       // Reddish (Adjusted)
    vacation: '#fcc419',      // Yellow/Orange (Adjusted)
    yearMarker: '#4caf50',    // Green
    semesterMarker: '#03a9f4', // Light Blue
    task: '#ff9800',          // Orange (Example for tasks)
    default: '#6c757d'        // Grey
};

// Define text colors for better contrast on some backgrounds
const EVENT_TEXT_COLORS = {
    holiday: '#c92a2a',       // Darker red text
    vacation: '#866100',      // Darker yellow/brown text
    yearMarker: '#1b5e20',
    semesterMarker: '#01579b',
    task: '#ffffff',          // White text on orange
    default: '#ffffff'
};


// --- Main Management Page Component ---
export default function TimeTableManagementPage() {
    // State for calendar events, loading, and errors
    const [allCalendarEvents, setAllCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for controlling the main Add/Edit modal flow
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEventDataForModal, setSelectedEventDataForModal] = useState(null); // Data for editing (null for adding)
    const [selectedRecordTypeForModal, setSelectedRecordTypeForModal] = useState(null); // Type for modal context
    const [modalDefaultDate, setModalDefaultDate] = useState(null); // Default date for adding

    // State for the separate "Manage Entities" dialog (controlled by this page)
    const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);

    // Memoize the lecturers map to avoid fetching repeatedly unless necessary
    // Dependency array is empty as it relies on cache after first load.
    // If lecturers could change dynamically, this would need a trigger to update.
    const lecturersMap = useMemo(() => getLecturersMap(), []);

    // --- Data Fetching and Formatting Logic ---
    const fetchAndFormatAllEvents = useCallback(() => {
        console.log("[ManagementPage] Fetching and formatting ALL calendar events...");
        setIsLoading(true);
        setError(null); // Clear previous errors before fetching

        try {
            const combinedEvents = []; // Array to hold events formatted for FullCalendar

            // 1. Course Meetings
            const rawMeetings = getRecords("coursesMeetings") || [];
            const formattedMeetings = rawMeetings.map((meeting) => {
                const start = formatDateTime(meeting.date, meeting.startHour);
                const end = formatDateTime(meeting.date, meeting.endHour);
                if (!start || !end) { console.warn(`Skipping meeting ${meeting.id} due to invalid date/time.`); return null; }
                const lecturerName = lecturersMap.get(meeting.lecturerId);
                const color = EVENT_COLORS.courseMeeting;
                return {
                    id: meeting.id,
                    title: `${meeting.courseName || 'Meeting'} (${lecturerName || meeting.lecturerId || 'N/A'})`, // Include lecturer for clarity
                    start, end, allDay: false, color, borderColor: color,
                    classNames: ['fc-event-course-meeting'], // Add specific class
                    extendedProps: { ...meeting, type: "courseMeeting", recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null }
                };
            }).filter(Boolean);
            combinedEvents.push(...formattedMeetings);

            // 2. General Public Events
            const rawGeneralEvents = getRecords("events") || [];
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

            // 3. Holidays
            const rawHolidays = getRecords("holidays") || [];
            const formattedHolidays = rawHolidays.map((holiday) => {
                if (!holiday.holidayCode || !holiday.startDate) return null;
                const exclusiveEnd = getExclusiveEndDate(holiday.startDate, holiday.endDate);
                const bgColor = EVENT_COLORS.holiday; const textColor = EVENT_TEXT_COLORS.holiday;
                return {
                    id: holiday.holidayCode, title: holiday.holidayName || 'Holiday', start: holiday.startDate, end: exclusiveEnd,
                    allDay: true, display: 'block', // Use block display for holidays/vacations
                    backgroundColor: bgColor, borderColor: bgColor, textColor: textColor || EVENT_TEXT_COLORS.default,
                    classNames: ['fc-event-block', 'fc-event-holiday'],
                    extendedProps: { ...holiday, type: 'holiday', recordTypeForModal: 'holiday' }
                };
            }).filter(Boolean);
            combinedEvents.push(...formattedHolidays);

            // 4. Vacations
            const rawVacations = getRecords("vacations") || [];
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

            console.log("[ManagementPage] Formatting Year/Semester markers as BLOCK events...");
            const years = getRecords("years") || [];
            const markerEvents = years.flatMap((year) => {
                if (!year.yearCode || !year.startDate || !year.endDate) {
                     console.warn("Skipping invalid year data:", year);
                     return [];
                }
                const yearColor = EVENT_COLORS.yearMarker;    // Original Green
                const yearBgColor = '#dcedc8';                // Lighter Green for block background
                const yearTextColor = EVENT_TEXT_COLORS.yearMarker || '#000000'; // Dark text
    
                const semesterColor = EVENT_COLORS.semesterMarker; // Original Light Blue
                const semesterBgColor = '#bbdefb';               // Lighter Blue for block background
                const semesterTextColor = EVENT_TEXT_COLORS.semesterMarker || '#000000'; // Dark text
    
                const markers = [];
    
                // --- Year Start Marker ---
                markers.push({
                    id: `y-start-${year.yearCode}`,
                    title: `Y${year.yearNumber} Start`, // Keep title short
                    start: year.startDate,
                    allDay: true,
                    display: 'block', // ✅ Changed from 'background'
                    backgroundColor: yearBgColor,
                    borderColor: yearColor, // Use original color for border
                    textColor: yearTextColor,
                    classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'], // Added class
                    extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } // Pass full year data
                });
    
                // --- Year End Marker ---
                markers.push({
                    id: `y-end-${year.yearCode}`,
                    title: `Y${year.yearNumber} End`,
                    start: year.endDate, // Marker on the actual end date
                    allDay: true,
                    display: 'block', // ✅ Changed from 'background'
                    backgroundColor: yearBgColor, // Same light green background
                    borderColor: yearColor,
                    textColor: yearTextColor,
                    classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'],
                    extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } // Pass full year data
                });
    
                // --- Semester Markers ---
                (year.semesters || []).forEach((semester) => {
                    if (!semester.semesterCode || !semester.startDate || !semester.endDate) {
                        console.warn("Skipping invalid semester data:", semester);
                        return;
                    }
                    const semesterDataWithYear = { ...semester, yearCode: year.yearCode }; // Include yearCode context
    
                    // Semester Start Marker
                    markers.push({
                        id: `s-start-${semester.semesterCode}`,
                        title: `S${semester.semesterNumber} Start`,
                        start: semester.startDate,
                        allDay: true,
                        display: 'block', // ✅ Changed from 'background'
                        backgroundColor: semesterBgColor,
                        borderColor: semesterColor,
                        textColor: semesterTextColor,
                        classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                        extendedProps: { ...semesterDataWithYear, type: 'semesterMarker', recordTypeForModal: 'semester' } // Pass semester data + yearCode
                    });
    
                    // Semester End Marker
                    markers.push({
                        id: `s-end-${semester.semesterCode}`,
                        title: `S${semester.semesterNumber} End`,
                        start: semester.endDate,
                        allDay: true,
                        display: 'block', // ✅ Changed from 'background'
                        backgroundColor: semesterBgColor,
                        borderColor: semesterColor,
                        textColor: semesterTextColor,
                        classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                        extendedProps: { ...semesterDataWithYear, type: 'semesterMarker', recordTypeForModal: 'semester' }
                    });
                });
                return markers; // Return markers for this year
            }).filter(Boolean); // Filter out any potential nulls if error handling added above
            combinedEvents.push(...markerEvents);
            console.log(`[ManagementPage] Formatted ${markerEvents.length} year/semester block markers.`);

            // 6. Tasks (Example)
            const rawTasks = getRecords("tasks") || [];
            const formattedTasks = rawTasks.map(task => {
                 if (!task.assignmentCode || !task.submissionDate) return null;
                 const start = formatDateTime(task.submissionDate, task.submissionHour || '23:59');
                 if (!start) return null;
                 const color = EVENT_COLORS.task; const textColor = EVENT_TEXT_COLORS.task;
                 return {
                     id: task.assignmentCode, title: `Due: ${task.assignmentName || 'Task'}`, start, allDay: false,
                     color, borderColor: color, textColor: textColor || EVENT_TEXT_COLORS.default,
                     classNames: ['fc-event-task'],
                     extendedProps: { ...task, type: 'task', recordTypeForModal: 'task' }
                 };
            }).filter(Boolean);
            combinedEvents.push(...formattedTasks);


            // Set the final combined and formatted events to state
            setAllCalendarEvents(combinedEvents);
            console.log(`[ManagementPage] Event formatting complete. Total: ${combinedEvents.length}`);

        } catch (err) {
            console.error("[ManagementPage] Error loading or formatting events:", err);
            setError("Failed to load calendar data. Please try refreshing the page.");
            setAllCalendarEvents([]); // Clear events on error
        } finally {
            setIsLoading(false); // Ensure loading state is always turned off
        }
    }, [lecturersMap]); // lecturersMap is the main dependency here

    // --- Initial data load effect ---
    useEffect(() => {
        fetchAndFormatAllEvents();
    }, [fetchAndFormatAllEvents]); // Trigger fetch on mount and if the fetch function identity changes

    // --- Calendar Interaction Handlers ---
    const handleDateClick = useCallback((info) => {
        console.log("[ManagementPage] Date clicked:", info.dateStr);
        // Prepare for ADD mode
        setSelectedEventDataForModal(null);
        setSelectedRecordTypeForModal(null); // AddModal will handle type selection
        setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
        setIsModalOpen(true); // Open the controller modal
    }, []);

    const handleEventClick = useCallback((info) => {
        const clickedEvent = info.event;
        const props = clickedEvent.extendedProps;
        console.log(`[ManagementPage] Event clicked: ID=${clickedEvent.id}, Type=${props?.type}, RecordTypeForModal=${props?.recordTypeForModal}`);
        console.log(`[handleEventClick] Clicked Event ID: ${clickedEvent.id}`);
        console.log(`[handleEventClick] extendedProps (props):`, props);
        console.log(`[handleEventClick] props.recordTypeForModal:`, props?.recordTypeForModal);

        // Ensure necessary data exists for editing
        if (!props || !props.recordTypeForModal) {
            console.warn("[ManagementPage] Clicked event missing critical extendedProps. Cannot edit.");
            alert("Cannot edit this event: Missing required internal data.");
            return;
        }

        // Prevent editing student personal events from this interface
        if (props.type === 'studentEvent') {
            console.log("[ManagementPage] Clicked on a student's personal event. Editing disabled on this page.");
            alert(`Student Event: ${clickedEvent.title}\n(Cannot be edited from the management page)`);
            return;
        }

        else if (props.recordTypeForModal === 'semester') {
          // ✅ לוג ספציפי לסמסטר
          console.log('[handleEventClick] SEMESTER CLICK DETECTED. Preparing to open EDIT modal.');
     } else {
          console.log('[handleEventClick] OTHER EDITABLE EVENT CLICK DETECTED. Preparing to open EDIT modal.');
     }

        // Prepare for EDIT mode
        setSelectedEventDataForModal(props); // Pass the full raw data from extendedProps
        setSelectedRecordTypeForModal(props.recordTypeForModal); // Pass the type hint for the modal
        setModalDefaultDate(null); // Not needed for editing
        setIsModalOpen(true); // Open the controller modal
    }, []);

    // --- Modal Control Handlers ---
    // Closes the Add/Edit modal part
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        // Reset potentially stale state when closing
        setSelectedEventDataForModal(null);
        setSelectedRecordTypeForModal(null);
        setModalDefaultDate(null);
    }, []);

    // Callback function passed to the Controller Modal. Triggered after ANY successful save/delete operation.
    const handleSuccessfulSaveOrDelete = useCallback(() => {
        console.log("[ManagementPage] Received successful save/delete signal. Refreshing data...");
        // Ensure relevant modals are closed
        if (isModalOpen) handleCloseModal();
        if (isManageEntitiesModalOpen) setIsManageEntitiesModalOpen(false); // Close entities dialog too if it was open

        fetchAndFormatAllEvents(); // Trigger data refresh
        // Optionally: Show a temporary success notification (Snackbar)
    }, [handleCloseModal, fetchAndFormatAllEvents, isModalOpen, isManageEntitiesModalOpen]);

    // --- Render Logic ---
    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "0 auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Timetable Management Console
            </Typography>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center">
                <Button variant="contained" color="primary" startIcon={<span>➕</span>} onClick={() => { setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null); setModalDefaultDate(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }} sx={{ whiteSpace: 'nowrap' }}>
                    Add New Record
                </Button>
                <Button variant="contained" color="secondary" startIcon={<span>⚙️</span>} onClick={() => setIsManageEntitiesModalOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Entities
                </Button>
            </Stack>

            {/* Error Display */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Loading Indicator */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading Calendar Data...</Typography>
                </Box>
            ) : (
                // Calendar View
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 0.5, sm: 1 } }}>
                    <FullCalendarView
                        // key={allCalendarEvents.length} // Use key only if experiencing stale render issues
                        events={allCalendarEvents}
                        onDateClick={handleDateClick}
                        onEventClick={handleEventClick}
                        // Add any specific FullCalendar options suitable for admin view
                        // e.g., more view options, different initial view?
                        // initialView="timeGridWeek"
                    />
                </Box>
            )}

            {/* The ONE Controller Modal - It handles showing Add or Edit internally */}
            <TimeTableCalendarManageModal
                // --- Props for Add/Edit Modal Flow ---
                open={isModalOpen}                  // Controls visibility of Add/Edit part
                onClose={handleCloseModal}          // Closes the Add/Edit part
                onSave={handleSuccessfulSaveOrDelete} // Callback after *any* successful save/delete for refresh

                // Data passed down to determine Add vs Edit and populate Edit form
                initialData={selectedEventDataForModal} // Data for editing (null for Add)
                recordType={selectedRecordTypeForModal} // Type hint for EditModal
                defaultDate={modalDefaultDate}        // Default date for AddModal

                // --- Props for the Nested 'Manage Entities' Dialog ---
                manageEntitiesOpen={isManageEntitiesModalOpen} // Controls visibility of the entities dialog
                setManageEntitiesOpen={setIsManageEntitiesModalOpen} // Allows the controller modal to close the entities dialog
            />
        </Box>
    );
}