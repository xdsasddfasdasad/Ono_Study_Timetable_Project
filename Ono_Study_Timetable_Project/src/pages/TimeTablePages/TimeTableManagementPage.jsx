// src/pages/TimeTablePages/TimeTableManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import { getRecords } from "../../utils/storage";
import { formatDateTime, getExclusiveEndDate } from '../../utils/eventFormatters';

let lecturersMapCache = null;

const getLecturersMap = () => {
    if (lecturersMapCache) return lecturersMapCache;

    console.log("[ManagementPage:getLecturersMap] Creating lecturers map...");
    try {
        const lecturers = getRecords("lecturers") || [];
        lecturersMapCache = new Map(lecturers.map(l => [l.id, l.name]));
        return lecturersMapCache;
    } catch (error) {
         console.error("[ManagementPage:getLecturersMap] Error creating lecturers map:", error);
         lecturersMapCache = new Map();
         return lecturersMapCache;
    }
};

const EVENT_COLORS = {
    courseMeeting: '#3788d8',
    event: '#8884d8',
    holiday: '#fa5252',
    vacation: '#fcc419',
    yearMarker: '#4caf50',
    semesterMarker: '#03a9f4',
    task: '#ff9800',
    default: '#6c757d'
};

const EVENT_TEXT_COLORS = {
    holiday: '#c92a2a',
    vacation: '#866100',
    yearMarker: '#1b5e20',
    semesterMarker: '#01579b',
    task: '#ffffff',
    default: '#ffffff'
};

export default function TimeTableManagementPage() {
    const [allCalendarEvents, setAllCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEventDataForModal, setSelectedEventDataForModal] = useState(null);
    const [selectedRecordTypeForModal, setSelectedRecordTypeForModal] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);
    const lecturersMap = useMemo(() => getLecturersMap(), []);
    const fetchAndFormatAllEvents = useCallback(() => {
        console.log("[ManagementPage] Fetching and formatting ALL calendar events...");
        setIsLoading(true);
        setError(null);

        try {
            const combinedEvents = [];
            const rawMeetings = getRecords("coursesMeetings") || [];
            const formattedMeetings = rawMeetings.map((meeting) => {
                const start = formatDateTime(meeting.date, meeting.startHour);
                const end = formatDateTime(meeting.date, meeting.endHour);
                if (!start || !end) { console.warn(`Skipping meeting ${meeting.id} due to invalid date/time.`); return null; }
                const lecturerName = lecturersMap.get(meeting.lecturerId);
                const color = EVENT_COLORS.courseMeeting;
                return {
                    id: meeting.id,
                    title: `${meeting.courseName || 'Meeting'} (${lecturerName || 'N/A'})`,
                    start, end, allDay: false, color, borderColor: color,
                    classNames: ['fc-event-course-meeting'],
                    extendedProps: { ...meeting, type: "courseMeeting", recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null }
                };
            }).filter(Boolean);
            combinedEvents.push(...formattedMeetings);
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
            const rawHolidays = getRecords("holidays") || [];
            const formattedHolidays = rawHolidays.map((holiday) => {
                if (!holiday.holidayCode || !holiday.startDate) return null;
                const exclusiveEnd = getExclusiveEndDate(holiday.startDate, holiday.endDate);
                const bgColor = EVENT_COLORS.holiday; const textColor = EVENT_TEXT_COLORS.holiday;
                return {
                    id: holiday.holidayCode, title: holiday.holidayName || 'Holiday', start: holiday.startDate, end: exclusiveEnd,
                    allDay: true, display: 'block',
                    backgroundColor: bgColor, borderColor: bgColor, textColor: textColor || EVENT_TEXT_COLORS.default,
                    classNames: ['fc-event-block', 'fc-event-holiday'],
                    extendedProps: { ...holiday, type: 'holiday', recordTypeForModal: 'holiday' }
                };
            }).filter(Boolean);
            combinedEvents.push(...formattedHolidays);
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
                const yearColor = EVENT_COLORS.yearMarker;
                const yearBgColor = '#dcedc8';
                const yearTextColor = EVENT_TEXT_COLORS.yearMarker || '#000000';
    
                const semesterColor = EVENT_COLORS.semesterMarker;
                const semesterBgColor = '#bbdefb';
                const semesterTextColor = EVENT_TEXT_COLORS.semesterMarker || '#000000';
                const markers = [];
                markers.push({
                    id: `y-start-${year.yearCode}`,
                    title: `Y${year.yearNumber} Start`,
                    start: year.startDate,
                    allDay: true,
                    display: 'block',
                    backgroundColor: yearBgColor,
                    borderColor: yearColor,
                    textColor: yearTextColor,
                    classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'],
                    extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' }
                });
                markers.push({
                    id: `y-end-${year.yearCode}`,
                    title: `Y${year.yearNumber} End`,
                    start: year.endDate, 
                    allDay: true,
                    display: 'block',
                    backgroundColor: yearBgColor,
                    borderColor: yearColor,
                    textColor: yearTextColor,
                    classNames: ['fc-event-marker', 'fc-event-year-marker', 'fc-event-block-marker'],
                    extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' }
                });
    
                (year.semesters || []).forEach((semester) => {
                    if (!semester.semesterCode || !semester.startDate || !semester.endDate) {
                        console.warn("Skipping invalid semester data:", semester);
                        return;
                    }
                    const semesterDataWithYear = { ...semester, yearCode: year.yearCode };
                        markers.push({
                        id: `s-start-${semester.semesterCode}`,
                        title: `S${semester.semesterNumber} / Y${year.yearNumber} Start`,
                        start: semester.startDate,
                        allDay: true,
                        display: 'block',
                        backgroundColor: semesterBgColor,
                        borderColor: semesterColor,
                        textColor: semesterTextColor,
                        classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                        extendedProps: { ...semesterDataWithYear, type: 'semesterMarker', recordTypeForModal: 'semester' }
                    });
    
                    markers.push({
                        id: `s-end-${semester.semesterCode}`,
                        title: `S${semester.semesterNumber} End`,
                        start: semester.endDate,
                        allDay: true,
                        display: 'block',
                        backgroundColor: semesterBgColor,
                        borderColor: semesterColor,
                        textColor: semesterTextColor,
                        classNames: ['fc-event-marker', 'fc-event-semester-marker', 'fc-event-block-marker'],
                        extendedProps: { ...semesterDataWithYear, type: 'semesterMarker', recordTypeForModal: 'semester' }
                    });
                });
                return markers;
            }).filter(Boolean);
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


            setAllCalendarEvents(combinedEvents);
            console.log(`[ManagementPage] Event formatting complete. Total: ${combinedEvents.length}`);

        } catch (err) {
            console.error("[ManagementPage] Error loading or formatting events:", err);
            setError("Failed to load calendar data. Please try refreshing the page.");
            setAllCalendarEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, [lecturersMap]);

    useEffect(() => {
        fetchAndFormatAllEvents();
    }, [fetchAndFormatAllEvents]);


    const handleDateClick = useCallback((info) => {
        console.log("[ManagementPage] Date clicked:", info.dateStr);
        setSelectedEventDataForModal(null);
        setSelectedRecordTypeForModal(null);
        setModalDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
        setIsModalOpen(true);
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
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedEventDataForModal(null);
        setSelectedRecordTypeForModal(null);
        setModalDefaultDate(null);
    }, []);

    const handleSuccessfulSaveOrDelete = useCallback(() => {
        console.log("[ManagementPage] Received successful save/delete signal. Refreshing data...");
        if (isModalOpen) handleCloseModal();
        if (isManageEntitiesModalOpen) setIsManageEntitiesModalOpen(false);

        fetchAndFormatAllEvents();
    }, [handleCloseModal, fetchAndFormatAllEvents, isModalOpen, isManageEntitiesModalOpen]);

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "0 auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Timetable Management Console
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center">
                <Button variant="contained" color="primary" startIcon={<span>➕</span>} onClick={() => { setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null); setModalDefaultDate(new Date().toISOString().split('T')[0]); setIsModalOpen(true); }} sx={{ whiteSpace: 'nowrap' }}>
                    Add New Record
                </Button>
                <Button variant="contained" color="secondary" startIcon={<span>⚙️</span>} onClick={() => setIsManageEntitiesModalOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Entities
                </Button>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }}>Loading Calendar Data...</Typography>
                </Box>
            ) : (
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 0.5, sm: 1 } }}>
                    <FullCalendarView
                        events={allCalendarEvents}
                        onDateClick={handleDateClick}
                        onEventClick={handleEventClick}
                    />
                </Box>
            )}
            <TimeTableCalendarManageModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSuccessfulSaveOrDelete}
                initialData={selectedEventDataForModal}
                recordType={selectedRecordTypeForModal}
                defaultDate={modalDefaultDate}
                manageEntitiesOpen={isManageEntitiesModalOpen}
                setManageEntitiesOpen={setIsManageEntitiesModalOpen}
            />
        </Box>
    );
}