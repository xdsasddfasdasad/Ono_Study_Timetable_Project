// src/pages/TimeTableListViewPage.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
// Imports a wide range of Material-UI components for layout, forms, and loading states.
import {
    Box, Typography, Stack, Button, CircularProgress, Alert, List, ListItem, ListItemText,
    ListSubheader, Divider, Paper, Chip, TextField, Tooltip, Checkbox,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, ListItemIcon, Grid,
    LinearProgress, Skeleton
} from '@mui/material';
// Imports contexts to get global event and authentication data.
import { useEvents } from '../../context/EventsContext';
import { useAuth } from '../../context/AuthContext';
// Imports the modal for adding/editing personal events.
import StudentPersonalEventFormModal from '../../components/modals/forms/StudentPersonalEventFormModal.jsx';
// Imports the central handlers for saving and deleting data.
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers.js";
// Imports the Firestore service for fetching auxiliary data.
import { fetchCollection } from '../../firebase/firestoreService.js';
// Imports date utility functions for parsing, comparing, and formatting dates.
import { format, parseISO, compareAsc, startOfWeek, isToday, isValid, getDay, isWithinInterval } from 'date-fns';

// --- Constants & Helpers ---
// A map to define a consistent color, label, and icon for each event type.
const EVENT_STYLES = {
    courseMeeting: { color: '#3788d8', label: 'Course', icon: '📚' },
    studentEvent: { color: '#ffc107', label: 'Personal', icon: '👤' },
    holiday: { color: '#e3342f', label: 'Holiday', icon: '🎉' },
    vacation: { color: '#f6993f', label: 'Vacation', icon: '🏖️' },
    event: { color: '#38c172', label: 'Event', icon: '🗓️' },
    task: { color: '#8e44ad', label: 'Task', icon: '📌' },
    yearMarker: { color: '#a5d6a7', label: 'Year Marker', icon: '🏁' },
    semesterMarker: { color: '#81d4fa', label: 'Semester Marker', icon: '🚩' },
};
const getEventStyle = (type) => EVENT_STYLES[type] || { color: '#6c757d', label: 'Other', icon: '❔' };
const ALL_EVENT_TYPES = Object.keys(EVENT_STYLES);
const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// A robust helper function to safely convert various date inputs into a valid Date object.
const toValidDate = (dateInput) => { if (!dateInput) return null; if (dateInput instanceof Date) return dateInput; if (typeof dateInput.toDate === 'function') return dateInput.toDate(); try { const date = parseISO(String(dateInput)); return isValid(date) ? date : null; } catch { return null; }};

// A helper component to show a "skeleton" of the list while data is loading.
// This provides a better user experience by showing a placeholder of the final layout.
const ListSkeleton = () => (
    <>
        {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
                <Skeleton variant="text" height={40} sx={{ mt: 2, borderRadius: 1 }} />
                <List component="ul" sx={{ width: '100%', p: 0 }}>
                    {Array.from({ length: 3 }).map((_, j) => (
                        <ListItem key={j} sx={{ borderLeft: '4px solid', borderColor: 'divider', mb: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 70 }}><Skeleton variant="text" width={50} /></ListItemIcon>
                            <ListItemText primary={<Skeleton variant="text" />} secondary={<Skeleton variant="text" width="60%" />} />
                        </ListItem>
                    ))}
                </List>
            </div>
        ))}
    </>
);

// This is the "smart" page component for the list view. It manages a complex state
// for filtering and displaying events in a chronological, grouped list.
export default function TimeTableListViewPage() {
    // === CONTEXT & DATA FETCHING ===
    const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
    const { currentUser } = useAuth();
    const todayRef = useRef(null); // A ref to auto-scroll to the "today" section if it exists.

    // State for auxiliary data needed for filters (courses, years).
    const [isLoadingAuxData, setIsLoadingAuxData] = useState(true);
    const [courses, setCourses] = useState([]);
    const [years, setYears] = useState([]);
    
    // The main loading state for the page, true if either event data or filter data is loading.
    const isLoading = isLoadingEvents || isLoadingAuxData;

    // Effect to fetch the auxiliary data needed for the filter dropdowns once.
    useEffect(() => {
        setIsLoadingAuxData(true);
        Promise.all([
            fetchCollection("courses"),
            fetchCollection("years")
        ]).then(([coursesData, yearsData]) => {
            setCourses((coursesData || []).sort((a,b) => a.courseName.localeCompare(b.courseName)));
            setYears((yearsData || []).sort((a,b) => a.yearNumber.localeCompare(b.yearNumber)));
        }).finally(() => {
            setIsLoadingAuxData(false);
        });
    }, []);

    // === MODAL STATE MANAGEMENT ===
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalError, setModalError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    // === FILTER STATE & HANDLERS ===
    const [filters, setFilters] = useState({
        searchText: '', eventTypes: ALL_EVENT_TYPES,
        startDate: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        endDate: '', courseCode: '', weekDay: '', yearCode: '', semesterCode: '',
    });

    // A single handler for most filter changes.
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            // Business logic for interdependent filters.
            if (name === 'yearCode') newFilters.semesterCode = ''; // Reset semester if year changes.
            if (name === 'courseCode') newFilters.eventTypes = value ? ['courseMeeting'] : ALL_EVENT_TYPES; // Auto-select 'Course' type if a course is chosen.
            return newFilters;
        });
    };

    // A special handler for the multi-select "Event Types" filter.
    const handleEventTypeFilterChange = (event) => {
        const { value } = event.target;
        const newEventTypes = typeof value === 'string' ? value.split(',') : value;

        if (value.includes('__select_all__')) {
            // Logic for the "Select All / None" checkbox.
            setFilters(prev => ({ ...prev, eventTypes: prev.eventTypes.length === ALL_EVENT_TYPES.length ? [] : ALL_EVENT_TYPES, courseCode: '' }));
        } else {
             setFilters(prev => ({ ...prev, eventTypes: newEventTypes, courseCode: newEventTypes.includes('courseMeeting') ? prev.courseCode : '' }));
        }
    };
    
    // Derived state for the "Select All" checkbox's appearance.
    const areAllTypesSelected = filters.eventTypes.length === ALL_EVENT_TYPES.length;
    const areSomeTypesSelected = filters.eventTypes.length > 0 && !areAllTypesSelected;

    // Memoized calculation for the available semesters based on the selected year.
    // This prevents re-calculation on every render.
    const availableSemesters = useMemo(() => {
        if (!filters.yearCode) return [];
        const selectedYear = years.find(y => y.yearCode === filters.yearCode);
        return (selectedYear?.semesters || []).sort((a, b) => a.semesterNumber.localeCompare(b.semesterNumber));
    }, [filters.yearCode, years]);
    
    // The core logic of the page: a memoized function that filters and groups events.
    // This complex calculation only re-runs if the source events or the filters change.
    const filteredAndGroupedEvents = useMemo(() => {
        // --- Filtering Logic ---
        let dateRangeFilter = null;
        // Determine the date range from filters (semester > year > manual dates).
        if (filters.semesterCode) { const semester = availableSemesters.find(s => s.semesterCode === filters.semesterCode); if (semester?.startDate && semester.endDate) { dateRangeFilter = { start: parseISO(semester.startDate), end: parseISO(semester.endDate) }; } } 
        else if (filters.yearCode) { const year = years.find(y => y.yearCode === filters.yearCode); if (year?.startDate && year.endDate) { dateRangeFilter = { start: parseISO(year.startDate), end: parseISO(year.endDate) }; } } 
        else { const start = filters.startDate ? toValidDate(filters.startDate) : null; const end = filters.endDate ? toValidDate(filters.endDate) : null; if (start || end) { dateRangeFilter = { start: start || new Date(0), end: end || new Date(8640000000000000) }; } }
        // Apply all filters to the `allVisibleEvents` array.
        let events = allVisibleEvents.filter(event => { const props = event.extendedProps; const eventStart = toValidDate(event.start); if (!eventStart) return false; if (dateRangeFilter) { const validStart = isValid(dateRangeFilter.start) ? dateRangeFilter.start : null; const validEnd = isValid(dateRangeFilter.end) ? dateRangeFilter.end : null; if (validStart && validEnd && !isWithinInterval(eventStart, {start: validStart, end: validEnd})) { return false; } else if (validStart && !validEnd && compareAsc(eventStart, validStart) < 0) { return false; } else if (!validStart && validEnd && compareAsc(eventStart, validEnd) > 0) { return false; } } if (filters.eventTypes.length > 0) { if (!filters.eventTypes.includes(props.type)) return false; } else { return false; } if (filters.courseCode && props.type === 'courseMeeting' && props.courseCode !== filters.courseCode) return false; if (filters.weekDay !== '' && getDay(eventStart) !== parseInt(filters.weekDay)) return false; if (filters.searchText) { const lowercasedFilter = filters.searchText.toLowerCase(); const titleMatch = event.title?.toLowerCase().includes(lowercasedFilter); const notesMatch = props?.notes?.toLowerCase().includes(lowercasedFilter); if (!titleMatch && !notesMatch) return false; } return true; });
        // --- Sorting and Grouping Logic ---
        const sorted = [...events].sort((a, b) => compareAsc(toValidDate(a.start), toValidDate(b.start)));
        // Use `reduce` to group the sorted events by day.
        return sorted.reduce((acc, event) => { const dayKey = format(toValidDate(event.start), 'yyyy-MM-dd'); if (!acc[dayKey]) acc[dayKey] = []; acc[dayKey].push(event); return acc; }, {});
    }, [allVisibleEvents, filters, years, availableSemesters]);

    // === Modal and Data Handlers (similar to Calendar View) ===
    const handleCloseModal = useCallback(() => { setIsModalOpen(false); setSelectedEvent(null); setValidationErrors({}); setModalError('') }, []);
    const handleOpenAddModal = useCallback(() => { setSelectedEvent({ studentId: currentUser?.uid }); setIsModalOpen(true); }, [currentUser]);
    const handleOpenEditModal = useCallback((props) => { setSelectedEvent(props); setIsModalOpen(true); }, []);

    const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
        if (!currentUser?.uid) { setModalError("You must be logged in to save an event."); return; }
        setModalError(''); setValidationErrors({});
        let dataToSave = { ...formDataFromModal, studentId: currentUser.uid }; const mode = dataToSave.eventCode ? 'edit' : 'add';
        if (mode === 'add') { dataToSave.eventCode = `SE-${currentUser.uid}-${Date.now()}`; }
        const result = await handleSaveOrUpdateRecord( 'studentEvents', dataToSave, mode, { recordType: 'studentEvent', editingId: dataToSave.eventCode } );
        if (result.success) { refreshEvents(); handleCloseModal(); } else { setValidationErrors(result.errors || {}); setModalError(result.message || 'Failed to save event.'); }
    }, [currentUser, refreshEvents, handleCloseModal]);

    const handleDeletePersonalEvent = useCallback(async (eventCode) => {
        if (!window.confirm("Are you sure you want to delete this personal event?")) return;
        setModalError('');
        const result = await handleDeleteEntity('studentEvents', eventCode);
        if (result.success) { refreshEvents(); handleCloseModal(); } else { setModalError(result.message || 'Failed to delete event.'); }
    }, [refreshEvents, handleCloseModal]);

    if (eventsError) return <Alert severity="error">{String(eventsError)}</Alert>;

    // === MAIN RENDER OUTPUT ===
    return (
        <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: "1200px", margin: "auto" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h4" component="h1">Timetable List View</Typography>
                <Button onClick={handleOpenAddModal} variant="contained" disabled={!currentUser || isLoading}>Add Personal Event</Button>
            </Stack>

            {/* A global loading bar for the page. */}
            <Box sx={{ height: 4, mb: 2 }}>
                {isLoading && <LinearProgress />}
            </Box>
            
            {/* The filter bar UI. */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filters</Typography>
                <Grid container spacing={2} alignItems="center">
                    {/* All filter inputs are disabled while any data is loading. */}
                    <Grid item xs={12} lg={4}><TextField name="searchText" label="Search Title/Notes" variant="outlined" size="small" fullWidth value={filters.searchText} onChange={handleFilterChange} disabled={isLoading} /></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={isLoading}><InputLabel>Types</InputLabel><Select name="eventTypes" multiple value={filters.eventTypes} onChange={handleEventTypeFilterChange} input={<OutlinedInput label="Types" />} renderValue={(selected) => `${selected.length} of ${ALL_EVENT_TYPES.length} selected`}><MenuItem value="__select_all__"><Checkbox checked={areAllTypesSelected} indeterminate={areSomeTypesSelected} /><ListItemText primary="Select All / None" /></MenuItem><Divider />{ALL_EVENT_TYPES.map((key) => (<MenuItem key={key} value={key}><Checkbox checked={filters.eventTypes.indexOf(key) > -1} /><ListItemText primary={`${getEventStyle(key).icon} ${getEventStyle(key).label}`} /></MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={isLoading}><InputLabel>Course</InputLabel><Select name="courseCode" value={filters.courseCode} label="Course" onChange={handleFilterChange}><MenuItem value=""><em>All Courses</em></MenuItem>{courses.map((course, index) => (<MenuItem key={`${course.courseCode}-${index}`} value={course.courseCode}>{course.courseName}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={isLoading}><InputLabel>Year</InputLabel><Select name="yearCode" value={filters.yearCode} label="Year" onChange={handleFilterChange}><MenuItem value=""><em>All Years</em></MenuItem>{years.map((y, index) => (<MenuItem key={`${y.yearCode}-${index}`} value={y.yearCode}>{`Year ${y.yearNumber}`}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={isLoading || !filters.yearCode}><InputLabel>Semester</InputLabel><Select name="semesterCode" value={filters.semesterCode} label="Semester" onChange={handleFilterChange}><MenuItem value=""><em>All Semesters</em></MenuItem>{availableSemesters.map((s, index) => (<MenuItem key={`${s.semesterCode}-${index}`} value={s.semesterCode}>{`Sem. ${s.semesterNumber}`}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={isLoading}><InputLabel>Day</InputLabel><Select name="weekDay" value={filters.weekDay} label="Day" onChange={handleFilterChange}><MenuItem value=""><em>Any Day</em></MenuItem>{WEEK_DAYS.map((day, index) => (<MenuItem key={index} value={index}>{day}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6} md={3} lg={2}><TextField name="startDate" label="From" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.startDate} onChange={handleFilterChange} disabled={isLoading || !!filters.yearCode || !!filters.semesterCode} /></Grid>
                    <Grid item xs={12} sm={6} md={3} lg={2}><TextField name="endDate" label="To" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.endDate} onChange={handleFilterChange} disabled={isLoading || !!filters.yearCode || !!filters.semesterCode} /></Grid>
                </Grid>
            </Paper>

            {/* Improved rendering logic for the main content. */}
            {isLoading && Object.keys(filteredAndGroupedEvents).length === 0 ? <ListSkeleton /> : (
                <>
                    {/* Show a "no results" message only if not loading. */}
                    {Object.keys(filteredAndGroupedEvents).length === 0 && !isLoading && (
                        <Paper sx={{p: 3, textAlign: 'center'}}>No events match your current filters.</Paper>
                    )}
                    {/* Map over the grouped events to render the list. */}
                    {Object.entries(filteredAndGroupedEvents).map(([dayKey, eventsOnDay]) => (
                        <div key={dayKey} ref={isToday(parseISO(dayKey)) ? todayRef : null}>
                            <ListSubheader component="div" sx={{ bgcolor: isToday(parseISO(dayKey)) ? 'primary.light' : 'grey.200', color: isToday(parseISO(dayKey)) ? 'primary.contrastText' : 'inherit', mt: 2, borderRadius: 1 }}>
                                <Typography variant="subtitle1">{format(parseISO(dayKey), 'EEEE, MMMM d, yyyy')}</Typography>
                            </ListSubheader>
                            <List component="ul" sx={{ width: '100%', p: 0, bgcolor: 'background.paper' }}>
                                {eventsOnDay.map((event) => {
                                    const props = event.extendedProps;
                                    const style = getEventStyle(props.type);
                                    const isEditable = props.type === 'studentEvent' && props.studentId === currentUser?.uid;
                                    const eventStart = toValidDate(event.start);
                                    const timeString = event.allDay || !eventStart ? "All Day" : format(eventStart, 'HH:mm');
                                    return (
                                        <ListItem key={event.id} onClick={isEditable ? () => handleOpenEditModal(props) : undefined} sx={{ borderLeft: `4px solid ${style.color}`, mb: 0.5, '&:hover': { bgcolor: isEditable ? 'action.hover' : 'transparent' }, cursor: isEditable ? 'pointer' : 'default' }}>
                                            <ListItemIcon sx={{ minWidth: 70, color: 'text.secondary' }}><Typography variant="body2">{timeString}</Typography></ListItemIcon>
                                            <ListItemText primary={<Tooltip title={event.title}><Typography variant="body1" noWrap>{event.title}</Typography></Tooltip>} secondary={props.type === 'courseMeeting' ? `Lecturer: ${props.lecturerName || 'N/A'}` : null} />
                                            <Chip label={style.label} size="small" sx={{ bgcolor: style.color, color: 'white' }} />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </div>
                    ))}
                </>
            )}
            
            {/* The modal for adding/editing personal events. */}
            <StudentPersonalEventFormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSavePersonalEvent} onDelete={handleDeletePersonalEvent} initialData={selectedEvent} validationErrors={validationErrors} errorMessage={modalError} />
        </Box>
    );
}