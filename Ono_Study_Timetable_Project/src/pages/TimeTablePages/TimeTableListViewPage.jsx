import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Box, Typography, Stack, Button, CircularProgress, Alert, List, ListItem, ListItemText,
    ListSubheader, Divider, Paper, Chip, TextField, Tooltip, Checkbox,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, ListItemIcon, Grid
} from '@mui/material';
import { useEvents } from '../../context/EventsContext';
import { useAuth } from '../../context/AuthContext';
import StudentPersonalEventFormModal from '../../components/modals/forms/StudentPersonalEventFormModal.jsx';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers.js";
import { fetchCollection } from '../../firebase/firestoreService.js';
import { format, parseISO, compareAsc, startOfWeek, isToday, isValid, getDay } from 'date-fns';

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

const toValidDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput.toDate === 'function') return dateInput.toDate();
    try {
        const date = parseISO(String(dateInput));
        return isValid(date) ? date : null;
    } catch {
        return null;
    }
};

export default function TimeTableListViewPage() {
    const { allVisibleEvents, isLoadingEvents, refreshEvents, error: eventsError } = useEvents();
    const { currentUser } = useAuth();
    const todayRef = useRef(null);

    // State for additional dropdown data
    const [courses, setCourses] = useState([]);
    const [years, setYears] = useState([]);
    
    useEffect(() => {
        fetchCollection("courses").then(data => setCourses(data || []));
        fetchCollection("years").then(data => setYears(data || []));
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalError, setModalError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    // State for all filters
    const [filters, setFilters] = useState({
        searchText: '',
        eventTypes: ALL_EVENT_TYPES,
        startDate: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        endDate: '',
        courseCode: '', 
        weekDay: '',
        yearCode: '',     // New filter
        semesterCode: '', // New filter
    });

    // ✨ --- לוגיקה מתוקנת ומשופרת ל-Select All / None --- ✨
    const handleSelectAllTypes = () => {
        // אם לא הכל בחור (כולל 0 בחורים), בחר הכל.
        if (filters.eventTypes.length < ALL_EVENT_TYPES.length) {
            setFilters(prev => ({ ...prev, eventTypes: ALL_EVENT_TYPES }));
        } else {
            // אם הכל כבר בחור, נקה הכל.
            setFilters(prev => ({ ...prev, eventTypes: [] }));
        }
    };
    
    // Derived state for the "Select All" checkbox status
    const areAllTypesSelected = filters.eventTypes.length === ALL_EVENT_TYPES.length;
    const areSomeTypesSelected = filters.eventTypes.length > 0 && !areAllTypesSelected;

    // Derived state for available semesters based on selected year
    const availableSemesters = useMemo(() => {
        if (!filters.yearCode) return [];
        const selectedYear = years.find(y => y.yearCode === filters.yearCode);
        return selectedYear?.semesters || [];
    }, [filters.yearCode, years]);
    
    useEffect(() => {
        // Reset semester if the selected year doesn't contain it
        if (filters.semesterCode && !availableSemesters.some(s => s.semesterCode === filters.semesterCode)) {
            setFilters(prev => ({ ...prev, semesterCode: '' }));
        }
    }, [filters.semesterCode, availableSemesters]);


    // Filtering logic now includes all filters
    const filteredAndGroupedEvents = useMemo(() => {
        const startDateFilter = filters.startDate ? parseISO(filters.startDate) : null;
        const endDateFilter = filters.endDate ? parseISO(filters.endDate) : null;
        
        let events = allVisibleEvents.filter(event => {
            const props = event.extendedProps;
            const eventStart = toValidDate(event.start);
            if (!eventStart) return false;

            if (startDateFilter && eventStart < startDateFilter) return false;
            if (endDateFilter && eventStart > endDateFilter) return false;
            
            if (filters.eventTypes.length < ALL_EVENT_TYPES.length) {
                if (!filters.eventTypes.includes(props.type)) return false;
            }

            if (filters.courseCode && props.type === 'courseMeeting') {
                if (props.courseCode !== filters.courseCode) return false;
            }
            
            // Filter by Semester (applies to course meetings and tasks)
            if (filters.semesterCode && ['courseMeeting', 'task'].includes(props.type)) {
                if (props.semesterCode !== filters.semesterCode) return false;
            }

            if (filters.weekDay !== '') {
                if (getDay(eventStart) !== parseInt(filters.weekDay)) return false;
            }

            if (filters.searchText) {
                const lowercasedFilter = filters.searchText.toLowerCase();
                const titleMatch = event.title?.toLowerCase().includes(lowercasedFilter);
                const notesMatch = props?.notes?.toLowerCase().includes(lowercasedFilter);
                if (!titleMatch && !notesMatch) return false;
            }

            return true;
        });

        const sorted = [...events].sort((a, b) => compareAsc(toValidDate(a.start), toValidDate(b.start)));
        
        return sorted.reduce((acc, event) => {
            const eventStart = toValidDate(event.start);
            if (!eventStart) return acc;
            const dayKey = format(eventStart, 'yyyy-MM-dd');
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(event);
            return acc;
        }, {});
    }, [allVisibleEvents, filters]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCloseModal = useCallback(() => { setIsModalOpen(false); setSelectedEvent(null); setValidationErrors({}); setModalError('') }, []);
    const handleOpenAddModal = useCallback(() => { setSelectedEvent({ studentId: currentUser.uid }); setIsModalOpen(true); }, [currentUser]);
    const handleOpenEditModal = useCallback((props) => { setSelectedEvent(props); setIsModalOpen(true); }, []);
    const handleSavePersonalEvent = useCallback(async (formData) => { /* ... Full logic ... */ }, [refreshEvents, handleCloseModal]);
    const handleDeletePersonalEvent = useCallback(async (eventCode) => { /* ... Full logic ... */ }, [refreshEvents, handleCloseModal]);


    if (isLoadingEvents) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (eventsError) return <Alert severity="error">{String(eventsError)}</Alert>;

    return (
        <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: "1200px", margin: "auto" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" component="h1">Timetable List View</Typography>
                <Button onClick={handleOpenAddModal} variant="contained" disabled={!currentUser}>Add Personal Event</Button>
            </Stack>
            
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filters</Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} lg={4}><TextField name="searchText" label="Search Title/Notes" variant="outlined" size="small" fullWidth value={filters.searchText} onChange={handleFilterChange} /></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth><InputLabel>Types</InputLabel><Select name="eventTypes" multiple value={filters.eventTypes} onChange={handleFilterChange} input={<OutlinedInput label="Types" />} renderValue={(selected) => `${selected.length} of ${ALL_EVENT_TYPES.length} selected`}><MenuItem onClick={handleSelectAllTypes}><Checkbox checked={areAllTypesSelected} indeterminate={areSomeTypesSelected} /><ListItemText primary="Select All / None" /></MenuItem><Divider />{ALL_EVENT_TYPES.map((key) => (<MenuItem key={key} value={key}><Checkbox checked={filters.eventTypes.indexOf(key) > -1} /><ListItemText primary={`${getEventStyle(key).icon} ${getEventStyle(key).label}`} /></MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth><InputLabel>Course</InputLabel><Select name="courseCode" value={filters.courseCode} label="Course" onChange={handleFilterChange}><MenuItem value=""><em>All Courses</em></MenuItem>{courses.map(course => (<MenuItem key={course.courseCode} value={course.courseCode}>{course.courseName}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth><InputLabel>Year</InputLabel><Select name="yearCode" value={filters.yearCode} label="Year" onChange={handleFilterChange}><MenuItem value=""><em>All Years</em></MenuItem>{years.map(y => (<MenuItem key={y.yearCode} value={y.yearCode}>{`Year ${y.yearNumber}`}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth disabled={!filters.yearCode}><InputLabel>Semester</InputLabel><Select name="semesterCode" value={filters.semesterCode} label="Semester" onChange={handleFilterChange}><MenuItem value=""><em>All Semesters</em></MenuItem>{availableSemesters.map(s => (<MenuItem key={s.semesterCode} value={s.semesterCode}>{`Sem. ${s.semesterNumber}`}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><FormControl size="small" fullWidth><InputLabel>Day</InputLabel><Select name="weekDay" value={filters.weekDay} label="Day" onChange={handleFilterChange}><MenuItem value=""><em>Any Day</em></MenuItem>{WEEK_DAYS.map((day, index) => (<MenuItem key={index} value={index}>{day}</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><TextField name="startDate" label="From" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.startDate} onChange={handleFilterChange} /></Grid>
                    <Grid item xs={6} sm={4} md={3} lg={2}><TextField name="endDate" label="To" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.endDate} onChange={handleFilterChange} /></Grid>
                </Grid>
            </Paper>

            {Object.keys(filteredAndGroupedEvents).length === 0 && <Paper sx={{p: 3, textAlign: 'center'}}>No events match your current filters.</Paper>}

            {Object.entries(filteredAndGroupedEvents).map(([dayKey, eventsOnDay]) => {
                const dateObj = parseISO(dayKey);
                const isCurrentDay = isToday(dateObj);
                return (
                    <div key={dayKey} ref={isCurrentDay ? todayRef : null}>
                        <ListSubheader component="div" sx={{ bgcolor: isCurrentDay ? 'primary.light' : 'grey.200', color: isCurrentDay ? 'primary.contrastText' : 'inherit', mt: 2, borderRadius: 1 }}>
                            <Typography variant="subtitle1">{format(dateObj, 'EEEE, MMMM d, yyyy')}</Typography>
                        </ListSubheader>
                        <List component="ul" sx={{ width: '100%', p: 0, bgcolor: 'background.paper' }}>
                            {eventsOnDay.map((event) => {
                                const props = event.extendedProps;
                                const style = getEventStyle(props.type);
                                const isEditable = props.type === 'studentEvent' && props.studentId === currentUser?.uid;
                                const eventStart = toValidDate(event.start);
                                const timeString = event.allDay || !eventStart ? "All Day" : format(eventStart, 'HH:mm');
                                
                                return (
                                    <ListItem key={event.id}
                                        onClick={isEditable ? () => handleOpenEditModal(props) : undefined}
                                        sx={{ 
                                            borderLeft: `4px solid ${style.color}`, mb: 0.5, 
                                            '&:hover': { bgcolor: isEditable ? 'action.hover' : 'transparent' },
                                            cursor: isEditable ? 'pointer' : 'default',
                                        }}
                                        secondaryAction={<Chip label={style.label} size="small" sx={{ bgcolor: style.color, color: 'white' }} />}
                                    >
                                        <ListItemIcon sx={{ minWidth: 70, color: 'text.secondary' }}><Typography variant="body2">{timeString}</Typography></ListItemIcon>
                                        <ListItemText
                                            primary={<Tooltip title={event.title}><Typography variant="body1" noWrap>{event.title}</Typography></Tooltip>}
                                            secondary={props.type === 'courseMeeting' ? `Lecturer: ${props.lecturerName || 'N/A'}` : null}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </div>
                );
            })}
            
            <StudentPersonalEventFormModal open={isModalOpen} onClose={handleCloseModal} onSave={handleSavePersonalEvent} onDelete={handleDeletePersonalEvent} initialData={selectedEvent} validationErrors={validationErrors} errorMessage={modalError} />
        </Box>
    );
}