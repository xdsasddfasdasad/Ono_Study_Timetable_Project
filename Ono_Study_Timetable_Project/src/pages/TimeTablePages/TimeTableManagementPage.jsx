// src/pages/TimeTablePages/TimeTableManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Stack, CircularProgress, Typography, Box, Alert } from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon, School as SchoolIcon } from '@mui/icons-material';
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import ManageCourseDefinitionModal from "../../components/modals/ManageCourseDefinitionModal";
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
    } catch (error) { /* ... error handling ... */ }
};


const EVENT_COLORS = {
    courseMeeting: '#42a5f5',
    event: '#ab47bc',
    holiday: '#ef9a9a',
    vacation: '#fff59d',
    task: '#ffa726',
    yearMarker: '#a5d6a7',
    semesterMarker: '#81d4fa',
    studentEvent: '#4db6ac',
    default: '#bdbdbd'
};


const EVENT_TEXT_COLORS = {
    courseMeeting: '#000000',
    event: '#ffffff',
    holiday: '#b71c1c',
    vacation: '#5d4037',
    task: '#000000',
    yearMarker: '#1b5e20',
    semesterMarker: '#01579b',
    studentEvent: '#ffffff',
    default: '#000000'
};

export default function TimeTableManagementPage() {
    const [allCalendarEvents, setAllCalendarEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [existingCourses, setExistingCourses] = useState([]);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [selectedEventDataForModal, setSelectedEventDataForModal] = useState(null);
    const [selectedRecordTypeForModal, setSelectedRecordTypeForModal] = useState(null);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null);
    const lecturersMap = useMemo(() => getLecturersMap(), []);
    const loadData = useCallback(() => {
        console.log("[ManagementPage:loadData] Loading ALL data (Events & Courses)...");
        setIsLoading(true);
        setError(null);

        try {
            const courses = getRecords("courses") || [];
            setExistingCourses(courses);
            console.log(`[ManagementPage:loadData] Loaded ${courses.length} course definitions.`);
            const combinedEvents = [];
            const currentLecturersMap = getLecturersMap();
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
                        title: `${meeting.courseName || 'Meeting'}`,
                        start, end, allDay: false, color, borderColor: color,
                        classNames: ['fc-event-course-meeting'],
                        extendedProps: { ...meeting, type: "courseMeeting", recordTypeForModal: "courseMeeting", lecturerName: lecturerName || null }
                    };
                }).filter(Boolean);
                combinedEvents.push(...formattedMeetings);
                console.log(`[ManagementPage:loadData] Formatted ${formattedMeetings.length} course meetings.`);
            } catch (err) { console.error("Error formatting meetings:", err); }
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
             try {
                const years = getRecords("years") || [];
                 console.log(`[ManagementPage:loadData] Raw years count: ${years.length}`);
                const markerEvents = years.flatMap((year) => {
                    if (!year.yearCode || !year.startDate || !year.endDate) return [];
                    const yearColor = EVENT_COLORS.yearMarker; const semesterColor = EVENT_COLORS.semesterMarker;
                    const markers = [];
                    markers.push({ id: `y-start-${year.yearCode}`, title: `Year${year.yearNumber} Start`, start: year.startDate, allDay: true, display: 'block', color: yearColor, classNames: ['fc-event-marker'], extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } });
                    markers.push({ id: `y-end-${year.yearCode}`, title: `Year${year.yearNumber} End`, start: year.endDate, allDay: true, display: 'block', color: yearColor, classNames: ['fc-event-marker'], extendedProps: { ...year, type: 'yearMarker', recordTypeForModal: 'year' } });
                    (year.semesters || []).forEach((s) => {
                         if (!s.semesterCode || !s.startDate || !s.endDate) return;
                         const semData = { ...s, yearCode: year.yearCode };
                         markers.push({ id: `s-start-${s.semesterCode}`, title: `Semester${s.semesterNumber}/Year${year.yearNumber} Start`, start: s.startDate, allDay: true, display: 'block', color: semesterColor, classNames: ['fc-event-marker'], extendedProps: { ...semData, type: 'semesterMarker', recordTypeForModal: 'semester' } });
                         markers.push({ id: `s-end-${s.semesterCode}`, title: `Semester${s.semesterNumber}/Year${year.yearNumber} End`, start: s.endDate, allDay: true, display: 'block', color: semesterColor, classNames: ['fc-event-marker'], extendedProps: { ...semData, type: 'semesterMarker', recordTypeForModal: 'semester' } });
                    });
                    return markers;
                }).filter(Boolean);
                combinedEvents.push(...markerEvents);
                 console.log(`[ManagementPage:loadData] Formatted ${markerEvents.length} year/semester markers.`);
            } catch (err) { console.error("Error formatting markers:", err); }
            try {
                const rawTasks = getRecords("tasks") || [];
                 console.log(`[ManagementPage:loadData] Raw tasks count: ${rawTasks.length}`);
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
                 console.log(`[ManagementPage:loadData] Formatted ${formattedTasks.length} tasks.`);
            } catch (err) { console.error("Error formatting tasks:", err); }
            setAllCalendarEvents(combinedEvents);
            console.log(`[ManagementPage:loadData] Total formatted events set to state: ${combinedEvents.length}`);

        } catch (err) {
            console.error("[ManagementPage:loadData] Overall error loading data:", err);
            setError("Failed to load required page data. Please check storage or refresh.");
            setAllCalendarEvents([]);
            setExistingCourses([]);
        } finally {
            setIsLoading(false);
            console.log("[ManagementPage:loadData] Finished.");
        }
    }, [lecturersMap]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    const handleDateClick = useCallback((info) => {
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
    
    const handleCloseCalendarModal = useCallback(() => {
        setIsCalendarModalOpen(false);
        setSelectedEventDataForModal(null); setSelectedRecordTypeForModal(null); setModalDefaultDate(null);
    }, []);

    const handleOpenCourseModal = (courseData = null) => {
        setCourseToEdit(courseData);
        setIsCourseModalOpen(true);
    };

    const handleCloseCourseModal = useCallback(() => {
        setIsCourseModalOpen(false);
        setCourseToEdit(null);
    }, []);

    const handleSuccessfulSaveOrDelete = useCallback(() => {
        console.log("[ManagementPage] Received successful save/delete signal. Reloading data...");
        if (isCalendarModalOpen) handleCloseCalendarModal();
        if (isCourseModalOpen) handleCloseCourseModal();
        if (isManageEntitiesModalOpen) setIsManageEntitiesModalOpen(false);
        loadData();
    }, [handleCloseCalendarModal, handleCloseCourseModal, isCalendarModalOpen, isCourseModalOpen, isManageEntitiesModalOpen, loadData]);

    return (
        <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1500px", margin: "auto" }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                Timetable Management Console
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => { setIsCalendarModalOpen(true); setSelectedEventDataForModal(null); }} sx={{ whiteSpace: 'nowrap' }}>
                    Add Calendar Entry
                </Button>
                <Button variant="contained" color="success" startIcon={<SchoolIcon />} onClick={() => handleOpenCourseModal(null)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Courses
                </Button>
                <Button variant="contained" color="secondary" startIcon={<SettingsIcon />} onClick={() => setIsManageEntitiesModalOpen(true)} sx={{ whiteSpace: 'nowrap' }}>
                    Manage Entities
                </Button>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {isLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}> <CircularProgress /> </Box> )
                       : ( <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1, p: { xs: 0.5, sm: 1 } }}>
                              <FullCalendarView events={allCalendarEvents} onDateClick={handleDateClick} onEventClick={handleEventClick} />
                           </Box> )}

            <TimeTableCalendarManageModal
                open={isCalendarModalOpen}
                onClose={handleCloseCalendarModal}
                onSave={handleSuccessfulSaveOrDelete}
                initialData={selectedEventDataForModal}
                recordType={selectedRecordTypeForModal}
                defaultDate={modalDefaultDate}
                manageEntitiesOpen={isManageEntitiesModalOpen}
                setManageEntitiesOpen={setIsManageEntitiesModalOpen}
            />

            <ManageCourseDefinitionModal
                open={isCourseModalOpen}
                onClose={handleCloseCourseModal}
                onSaveSuccess={handleSuccessfulSaveOrDelete}
                initialData={courseToEdit}
                existingCourses={existingCourses}
            />
        </Box>
    );
}