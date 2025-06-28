// src/pages/HomePage.jsx

import React, { useState, useEffect, useMemo } from 'react';
// Imports a wide range of Material-UI components for building a rich, interactive layout.
import { Box, Typography, Grid, Paper, Icon, Button, Stack, Divider, Chip, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon, FormControl, InputLabel, Select, MenuItem, TextField, Avatar, LinearProgress, Skeleton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
// Imports contexts and services for data fetching.
import { useAuth } from '../context/AuthContext';
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents';
import { fetchCollection } from '../firebase/firestoreService';
// Imports date utility functions for complex date manipulations.
import { format, parseISO, compareAsc, startOfDay, endOfDay, isWithinInterval, isValid, addDays } from 'date-fns';
import { deepOrange } from '@mui/material/colors';

// Imports all the necessary icons for the home page cards and lists.
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SchoolIcon from '@mui/icons-material/School';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// --- Constants & Helpers ---
// A map to define consistent styling for different data types.
const EVENT_STYLES = {
  courseMeeting:    { color: '#3788d8', label: 'Course Meeting',     icon: <SchoolIcon fontSize="small"/> },
  studentEvent:     { color: '#ffc107', label: 'Personal',           icon: <EventIcon fontSize="small"/> },
  holiday:          { color: '#e3342f', label: 'Holiday',            icon: <HelpOutlineIcon fontSize="small"/> },
  vacation:         { color: '#f6993f', label: 'Vacation',           icon: <HelpOutlineIcon fontSize="small"/> },
  event:            { color: '#38c172', label: 'General Event',      icon: <EventIcon fontSize="small"/> },
  task:             { color: '#8e44ad', label: 'Tasks',              icon: <TaskAltIcon fontSize="small"/> },
  yearMarker:       { color: '#a5d6a7', label: 'Year Marker',        icon: <SettingsIcon fontSize="small"/> },
  semesterMarker:   { color: '#81d4fa', label: 'Semester Marker',    icon: <SettingsIcon fontSize="small"/> },
  courseDefinition: { color: '#17a2b8', label: 'Course Definitions', icon: <MenuBookIcon fontSize="small"/> },
  default:          { color: '#6c757d', label: 'Other',              icon: <HelpOutlineIcon fontSize="small"/> }
};

const getEventStyle = (type) => EVENT_STYLES[type] || EVENT_STYLES.default;
// A robust helper function to safely convert various date inputs into a valid Date object.
const toValidDate = (dateInput) => { if (!dateInput) return null; if (dateInput instanceof Date) return dateInput; if (typeof dateInput.toDate === 'function') return dateInput.toDate(); try { const date = parseISO(String(dateInput)); return isValid(date) ? date : null; } catch { return null; } };

// A reusable card component for the "Quick Actions" section, designed to be visually appealing and interactive.
const HomeActionCard = ({ title, to, icon, description, color = "primary" }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={2} component={RouterLink} to={to} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', minHeight: 220, borderTop: 3, borderColor: `${color}.main`, transition: 'all 0.3s ease', textDecoration: 'none', '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' } }}>
            <Icon component={icon} sx={{ fontSize: 52, color: `${color}.main`, mb: 2 }} />
            <Typography variant="h5" component="div" sx={{ textAlign: 'center', mb: 1, color: 'text.primary', fontWeight: 'bold' }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', flexGrow: 1 }}>{description}</Typography>
        </Paper>
    </Grid>
);

// --- Main Component ---
// This is the main landing page for an authenticated user. It's designed to be a user-friendly
// starting point, providing a welcome message, easy navigation, and a quick summary of what's coming up.
export default function HomePage() {
    const { currentUser, isLoadingAuth } = useAuth();
    // === STATE MANAGEMENT ===
    // This `isLoading` state is now unified. It starts as true if auth is loading, and is manually
    // controlled during the data fetching process. This prevents UI flashes.
    const [isLoading, setIsLoading] = useState(isLoadingAuth);
    const [error, setError] = useState(null);
    const [rawData, setRawData] = useState({ events: [], tasks: [], students: [] });
    const [upcomingTimeFilter, setUpcomingTimeFilter] = useState('week');
    const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });

    // --- Data Fetching Effect ---
    useEffect(() => {
        // Don't do anything if we are still waiting for the initial authentication check.
        if (isLoadingAuth) {
            setIsLoading(true);
            return;
        }

        // Once auth is settled, ensure the loader is visible and start fetching data.
        setIsLoading(true);
        setError(null);
        
        const loadHomePageData = async () => {
            try {
                // Fetch all the necessary raw data in parallel.
                const [events, tasks, students] = await Promise.all([ getAllVisibleEvents(currentUser), fetchCollection('tasks'), fetchCollection('students') ]);
                setRawData({ events: events || [], tasks: tasks || [], students: students || [] });
            } catch (err) { 
                console.error("[HomePage] Error loading data:", err); 
                setError("Failed to load page data."); 
            } finally {
                // Turn off the loader only after all fetching (and potential errors) have completed.
                setIsLoading(false);
            }
        };

        loadHomePageData();
    }, [currentUser, isLoadingAuth]); // This effect re-runs if the user logs in/out.

    // --- Derived Data & Memoization ---
    // This `useMemo` hook is crucial for performance. It takes the raw data and filters
    // it to create the specific lists needed for the "At a Glance" panel.
    // These expensive calculations only re-run when the raw data or a filter changes.
    const { upcomingEvents, upcomingTasks, recentStudents } = useMemo(() => {
        const { events, tasks, students } = rawData;
        const now = new Date(); let interval;
        // Determine the date interval based on the user's filter selection.
        switch (upcomingTimeFilter) {
            case 'today': interval = { start: startOfDay(now), end: endOfDay(now) }; break;
            case 'month': interval = { start: now, end: addDays(now, 30) }; break;
            case 'custom': const s = toValidDate(customDateRange.startDate), e = toValidDate(customDateRange.endDate); interval = (s && e) ? { start: startOfDay(s), end: endOfDay(e) } : null; break;
            default: interval = { start: now, end: addDays(now, 7) }; break;
        }

        // Filter events and tasks to find those within the calculated interval.
        const calcUpcomingEvents = interval ? (events || []).filter(e => { const d = toValidDate(e.start); return d && isWithinInterval(d, interval); }).sort((a, b) => compareAsc(toValidDate(a.start), toValidDate(b.start))) : [];
        const relevantTasks = (tasks || []).filter(t => !t.studentId || t.studentId === currentUser?.uid);
        const calcUpcomingTasks = interval ? relevantTasks.filter(t => { const d = toValidDate(t.submissionDate); return d && isWithinInterval(d, interval); }).sort((a, b) => compareAsc(toValidDate(a.submissionDate), toValidDate(b.submissionDate))) : [];
        // Get the 5 most recently created student accounts.
        const calcRecentStudents = (students || []).sort((a, b) => compareAsc(toValidDate(b.createdAt), toValidDate(a.createdAt))).slice(0, 5);
        
        return { upcomingEvents: calcUpcomingEvents, upcomingTasks: calcUpcomingTasks, recentStudents: calcRecentStudents };
    }, [rawData, upcomingTimeFilter, currentUser, customDateRange]);

    // --- Filter Handlers ---
    const handleFilterChange = (event) => {
        setUpcomingTimeFilter(event.target.value);
        if (event.target.value !== 'custom') setCustomDateRange({ startDate: '', endDate: '' });
    };
    
    const handleDateChange = (event) => {
        setCustomDateRange(prev => ({ ...prev, [event.target.name]: event.target.value }));
    };
    
    // --- RENDER LOGIC ---
    // With the unified loading state, we no longer need a separate check for `isLoadingAuth`.
    // The `LinearProgress` bar will show until `isLoading` is false.
    const renderGlanceSkeletons = () => (
        <>
            <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }}/>
            <Divider sx={{my: 2}} />
            <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={100} />
        </>
    );

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 4 }, maxWidth: '1400px', mx: 'auto' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 1, fontWeight: 'bold' }}> Welcome, {currentUser?.firstName || 'User'}! </Typography>
            <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>Here is a summary of your upcoming schedule and system tools.</Typography>

            {/* A global loading bar for the page. */}
            {isLoading && <LinearProgress sx={{ mb: 4 }} />}
            
            {/* The main content of the page is only rendered when loading is complete. */}
            {!isLoading && (
                <Grid container spacing={4}>
                    {/* Main content area with action cards. */}
                    <Grid item xs={12} lg={8}>
                        <Typography variant="h5" component="div" sx={{ mb: 3 }}> Quick Actions </Typography>
                        <Grid container spacing={3}>
                            <HomeActionCard title="My Timetable" description="View your weekly schedule." icon={CalendarMonthIcon} to="/timetable/calendar" color="primary" />
                            <HomeActionCard title="Timetable List" description="See upcoming items in a list." icon={FormatListBulletedIcon} to="/timetable/list" color="primary" />
                            <HomeActionCard title="Dashboard" description="Full overview and statistics." icon={DashboardIcon} to="/dashboard" color="primary" />
                        </Grid>
                        <Divider sx={{my: 5}}><Chip label="Management Tools" /></Divider>
                        <Grid container spacing={3}>
                            <HomeActionCard title="Manage Timetable" description="Administer all calendar entries." icon={SettingsIcon} to="/manage-timetable" color="secondary" />
                            <HomeActionCard title="Manage Students" description="Handle student accounts." icon={SupervisedUserCircleIcon} to="/manage-students" color="secondary" />
                            <HomeActionCard title="Help & Support" description="Find answers and guides." icon={HelpOutlineIcon} to="/help" color="info" />
                        </Grid>
                    </Grid>
                    
                    {/* "At a Glance" Sidebar */}
                    <Grid item xs={12} lg={4}>
                        <Typography variant="h5" component="div" sx={{ mb: 3 }}>At a Glance</Typography>
                        <Paper elevation={2} sx={{p: 2, mb: 3}}>
                            <Stack spacing={2}>
                                <FormControl size="small" fullWidth disabled={isLoading}>
                                    <InputLabel>Upcoming Time Window</InputLabel>
                                    <Select value={upcomingTimeFilter} label="Upcoming Time Window" onChange={handleFilterChange}>
                                        <MenuItem value="today">Today</MenuItem><MenuItem value="week">Next 7 Days</MenuItem><MenuItem value="month">Next 30 Days</MenuItem><MenuItem value="custom">Custom Range</MenuItem>
                                    </Select>
                                </FormControl>
                                {upcomingTimeFilter === 'custom' && (<Stack direction="row" spacing={1}><TextField name="startDate" label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={customDateRange.startDate} onChange={handleDateChange} disabled={isLoading} /><TextField name="endDate" label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={customDateRange.endDate} onChange={handleDateChange} disabled={isLoading} /></Stack>)}
                            </Stack>
                            <Divider sx={{my: 2}} />
                            {error ? <Alert severity="error">{error}</Alert> : (
                                <>
                                    <Typography variant="subtitle1" sx={{fontWeight: 'bold', mb: 1}}>Events</Typography>
                                    <Box sx={{ maxHeight: 220, overflow: 'auto', pr: 1 }}>{upcomingEvents.length > 0 ? (<List dense disablePadding>{upcomingEvents.map((e, index) => {
                                        const eventType = e.extendedProps?.type || e.type;
                                        return (
                                            <ListItem key={e.id} dense>
                                                <ListItemText primary={e.title} secondary={`${format(toValidDate(e.start), 'EEE, d MMM, HH:mm')} - ${getEventStyle(e.extendedProps?.type).label}`} />
                                            </ListItem>
                                        );
                                    })}</List>) : (<Typography variant="body2" color="text.secondary">No upcoming events.</Typography>)}</Box>
                                    <Divider sx={{my: 2}} />
                                    <Typography variant="subtitle1" sx={{fontWeight: 'bold', mb: 1}}>Tasks</Typography>
                                    <Box sx={{ maxHeight: 220, overflow: 'auto', pr: 1 }}>{upcomingTasks.length > 0 ? (<List dense disablePadding>{upcomingTasks.map((t, index) => (
                                        <ListItem key={`task-${t.id || t.taskCode}-${index}`} disableGutters>
                                            <ListItemIcon sx={{minWidth: 32}}>{getEventStyle('task').icon}</ListItemIcon>
                                            <ListItemText primary={t.title} secondary={`Due: ${format(toValidDate(t.submissionDate), 'eeee, MMM d')}`} />
                                        </ListItem>
                                    ))}</List>) : (<Typography variant="body2" color="text.secondary">No upcoming tasks.</Typography>)}</Box>
                                </>
                            )}
                        </Paper>

                        <Paper elevation={2} sx={{p: 2}}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}><GroupAddIcon color="action" /><Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Recently Joined Students</Typography></Stack>
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {error ? null : recentStudents.length > 0 ? (
                                    <List dense disablePadding>
                                        {recentStudents.map((student, index) => (
                                            <ListItem key={`student-${student.id}-${index}`} disableGutters>
                                                <ListItemIcon><Avatar sx={{ bgcolor: deepOrange[500], width: 32, height: 32, fontSize: '1rem' }}>{student.firstName?.[0]}</Avatar></ListItemIcon>
                                                <ListItemText primary={`${student.firstName} ${student.lastName}`} secondary={student.email} />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (<Typography variant="body2" color="text.secondary">No student data available.</Typography>)}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}