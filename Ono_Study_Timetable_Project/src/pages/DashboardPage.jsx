import React, { useState, useEffect } from 'react'; // useMemo might not be strictly needed here anymore
import { Box, Typography, Grid, Paper, Link as MuiLink, Icon, List, ListItem, ListItemText, Divider, Chip, CircularProgress, Alert, Card, CardContent, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents'; // Already Firestore-ready
// ✅ Import fetchCollection
import { fetchCollection } from '../firebase/firestoreService'; // Assuming this path
import { format, parseISO, compareAsc, isFuture, isToday, differenceInDays, startOfDay, endOfWeek, startOfWeek } from 'date-fns';
// Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EventIcon from '@mui/icons-material/Event';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// --- Helper Components (DashboardCard, StatCard, getEventStyle - remain the same) ---
const getEventStyle = (eventType) => { /* ... */ };
const DashboardCard = ({ title, to, icon, description }) => { /* ... */ };
const StatCard = ({ title, value, icon }) => { /* ... */ };


export default function DashboardPage() {
    const { currentUser } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [stats, setStats] = useState({ studentCount: null, courseCount: null });
    const [weeklyEventData, setWeeklyEventData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDashboardData = async () => { // ✅ Make the entire function async
            console.log("[Dashboard] Loading data from Firestore...");
            setIsLoading(true); setError(null);
            try {
                // ✅ Fetch ALL data sources asynchronously using Promise.all
                const [
                    allEvents,      // Already includes personal if currentUser provided
                    allTasks,
                    allStudents,
                    allCourses
                ] = await Promise.all([
                    getAllVisibleEvents(currentUser), // This is already async
                    fetchCollection('tasks'),
                    fetchCollection('students'),
                    fetchCollection('courses')
                ]);

                // --- Process Upcoming Data (Next 7 Days) ---
                const now = startOfDay(new Date());
                const sevenDaysFromNow = new Date(now);
                sevenDaysFromNow.setDate(now.getDate() + 7);

                const upcomingEventsFiltered = (allEvents || [])
                    .filter(event => { /* ... filter logic as before ... */ })
                    .sort((a, b) => compareAsc(parseISO(a.start), parseISO(b.start)))
                    .slice(0, 5);

                const upcomingTasksFiltered = (allTasks || [])
                    .filter(task => { /* ... filter logic as before ... */ })
                    .sort((a,b) => compareAsc(parseISO(`${a.submissionDate}T${a.submissionHour||'23:59'}`), parseISO(`${b.submissionDate}T${b.submissionHour||'23:59'}`)))
                    .slice(0, 5);

                // --- Process Weekly Event Type Distribution ---
                const weekStart = startOfWeek(now, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
                const eventsThisWeek = (allEvents || []).filter(event => { /* ... */ });
                const eventCounts = eventsThisWeek.reduce((acc, event) => { /* ... */ }, {});
                const chartData = Object.entries(eventCounts).map(([type, count]) => ({ /* ... */ }));

                // --- Update State ---
                setUpcomingEvents(upcomingEventsFiltered);
                setUpcomingTasks(upcomingTasksFiltered);
                setStats({ studentCount: (allStudents || []).length, courseCount: (allCourses || []).length });
                setWeeklyEventData(chartData);
                console.log("[Dashboard] Data processed and state updated.");

            } catch (err) {
                console.error("[Dashboard] Error loading or processing data:", err);
                setError("Failed to load dashboard data. Please try refreshing.");
                setUpcomingEvents([]); setUpcomingTasks([]); setStats({ studentCount: null, courseCount: null }); setWeeklyEventData([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Call loadDashboardData only if currentUser is determined (not in auth loading state)
        // The useAuth hook should provide an isLoading state for this purpose.
        // Assuming AuthContext's isLoading state handles the initial Firebase auth check.
        if(currentUser !== undefined) { // Or check !authIsLoading if available from useAuth
             loadDashboardData();
        }

    }, [currentUser]); // Reload data if currentUser changes

    // --- Render Functions for Lists (renderEventItem, renderTaskItem - remain the same) ---
    const renderEventItem = (event) => { /* ... */ };
    const renderTaskItem = (task) => { /* ... */ };

    // --- Main Render ---
    if (isLoading && stats.studentCount === null) { // Show main loader only on initial load
        return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}> <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading Dashboard...</Typography> </Box> );
    }

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1200px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}> Dashboard </Typography>
            <Typography variant="h6" component="p" sx={{ mb: 4, color: 'text.secondary' }}> Welcome back, {currentUser?.firstName || currentUser?.username || currentUser?.email || 'User'}! </Typography>
                 <Box sx={{ mb: 4 }}>
                     <Typography variant="h6" component="div" sx={{ mb: 2 }}> System Overview </Typography>
                     <Grid container spacing={2}>
                          <StatCard title="Registered Students" value={isLoading ? '...' : stats.studentCount} icon={PeopleIcon} />
                          <StatCard title="Course Definitions" value={isLoading ? '...' : stats.courseCount} icon={SchoolIcon} />
                     </Grid>
                 </Box>
            <Box sx={{ mb: 4 }}>
                 <Typography variant="h6" component="div" sx={{ mb: 2 }}> Quick Actions </Typography>
                 <Grid container spacing={3}>
                      <DashboardCard title="My Timetable" to="/timetable/calendar" icon={CalendarMonthIcon} description="View your personal schedule." />
                      {/* Adjusted to /timetable/calendar from /my-timetable if that's the correct student view path */}
                      ( <> <DashboardCard title="Manage Timetable" to="/manage-timetable" icon={SettingsIcon} description="Administer timetable entries." /> <DashboardCard title="Manage Students" to="/manage-students" icon={SupervisedUserCircleIcon} description="Manage student accounts." /> </> )
                      <DashboardCard title="Help & Support" to="/help" icon={HelpOutlineIcon} description="Find answers and guides." />
                 </Grid>
            </Box>

            {/* Error Alert or Main Content */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Upcoming Data Section - Show even if other parts are loading (graceful display) */}
            <Grid container spacing={3}>
                {/* Upcoming Events */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                         <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <EventIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Upcoming Events</Typography> </Stack>
                         {isLoading && upcomingEvents.length === 0 ? <CircularProgress size={24}/> : upcomingEvents.length > 0 ? ( <List dense disablePadding> {upcomingEvents.map(renderEventItem)} </List> ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No upcoming events (next 7 days).</Typography> )}
                    </Paper>
                </Grid>
                {/* Upcoming Tasks */}
                <Grid item xs={12} md={4}>
                     <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <TaskAltIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Upcoming Tasks</Typography> </Stack>
                          {isLoading && upcomingTasks.length === 0 ? <CircularProgress size={24}/> : upcomingTasks.length > 0 ? ( <List dense disablePadding> {upcomingTasks.map(renderTaskItem)} </List> ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No upcoming tasks (next 7 days).</Typography> )}
                     </Paper>
                </Grid>
                {/* Weekly Event Chart */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <AssessmentIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Events This Week</Typography> </Stack>
                        {isLoading && weeklyEventData.length === 0 ? <CircularProgress size={24}/> : weeklyEventData.length > 0 ? (
                            <Box sx={{ height: 250 }}>
                                 <ResponsiveContainer width="100%" height="100%">
                                     <PieChart>
                                         <Pie data={weeklyEventData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} >
                                              {weeklyEventData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                                         </Pie>
                                         <RechartsTooltip />
                                     </PieChart>
                                 </ResponsiveContainer>
                            </Box>
                        ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No events to display for this week.</Typography> )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}