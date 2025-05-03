import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Paper, Link as MuiLink, Icon, List, ListItem, ListItemText, Divider, Chip, CircularProgress, Alert, Card, CardContent, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents';
import { getRecords } from '../utils/storage';
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

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
const getEventStyle = (eventType) => {
    const colors = { courseMeeting: '#42a5f5', event: '#ab47bc', holiday: '#ef9a9a', vacation: '#fff59d', task: '#ffa726', studentEvent: '#4db6ac', default: '#bdbdbd' };
    const labels = { courseMeeting: 'Course', event: 'Event', holiday: 'Holiday', vacation: 'Vacation', task: 'Task', studentEvent: 'Personal', default: 'Other' };
    return { color: colors[eventType] || colors.default, label: labels[eventType] || labels.default };
};
const DashboardCard = ({ title, to, icon, description }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', transition: 'box-shadow 0.3s', '&:hover': { boxShadow: 6 } }}>
            <Icon component={icon} sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom component="div" sx={{ textAlign: 'center' }}> {title} </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2, flexGrow: 1 }}> {description} </Typography>
            <MuiLink component={RouterLink} to={to} variant="button" underline="none"> Go to {title} </MuiLink>
        </Paper>
    </Grid>
);
const StatCard = ({ title, value, icon }) => (
    <Grid item xs={6} sm={4} md={3}>
         <Card elevation={2}>
             <CardContent sx={{ textAlign: 'center' }}>
                 <Icon component={icon} sx={{ fontSize: 36, color: 'action.active', mb: 1 }} />
                 <Typography variant="h6" component="div">{value ?? '...'}</Typography>
                 <Typography variant="caption" color="text.secondary">{title}</Typography>
             </CardContent>
         </Card>
    </Grid>
);
export default function DashboardPage() {
    const { currentUser } = useAuth();
    const isAdmin = currentUser?.id === 'admin1';
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [stats, setStats] = useState({ studentCount: null, courseCount: null });
    const [weeklyEventData, setWeeklyEventData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const loadDashboardData = () => {
            console.log("[Dashboard] Loading data...");
            setIsLoading(true); setError(null);
            try {
                const allEvents = getAllVisibleEvents(currentUser);
                const allTasks = getRecords('tasks') || [];
                const allStudents = getRecords('students') || [];
                const allCourses = getRecords('courses') || [];
                const now = startOfDay(new Date());
                const sevenDaysLater = new Date(now);
                sevenDaysLater.setDate(now.getDate() + 7);
                const upcomingEventsFiltered = allEvents
                    .filter(event => {
                        try {
                            const d = parseISO(event.start);
                            return !isNaN(d.getTime()) && d >= now && d <= sevenDaysLater;
                        } catch { return false; }
                    })
                    .sort((a, b) => compareAsc(parseISO(a.start), parseISO(b.start)))
                    .slice(0, 5);
                const upcomingTasksFiltered = allTasks
                    .filter(task => {
                        try {
                            const d = parseISO(`${task.submissionDate}T${task.submissionHour || '23:59:59'}`);
                            return !isNaN(d.getTime()) && d >= now && d <= sevenDaysLater;
                        } catch { return false; }
                    })
                    .sort((a, b) => compareAsc(parseISO(`${a.submissionDate}T${a.submissionHour||'23:59:59'}`), parseISO(`${b.submissionDate}T${b.submissionHour||'23:59:59'}`)))
                    .slice(0, 5);
                const weekStart = startOfWeek(now, { weekStartsOn: 0 });
                const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
                const eventsThisWeek = allEvents.filter(event => {
                    try { const d = parseISO(event.start); return !isNaN(d.getTime()) && d >= weekStart && d <= weekEnd; } catch { return false; }
                });
                const eventCounts = eventsThisWeek.reduce((acc, event) => {
                    const type = event.extendedProps?.type || 'default';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {});
                const chartData = Object.entries(eventCounts).map(([type, count]) => ({
                     name: getEventStyle(type).label,
                     value: count,
                     fill: getEventStyle(type).color
                }));
                setUpcomingEvents(upcomingEventsFiltered);
                setUpcomingTasks(upcomingTasksFiltered);
                setStats({ studentCount: allStudents.length, courseCount: allCourses.length });
                setWeeklyEventData(chartData);

            } catch (err) {
                console.error("[Dashboard] Error loading data:", err);
                setError("Failed to load dashboard data.");
                setUpcomingEvents([]); setUpcomingTasks([]); setStats({ studentCount: null, courseCount: null }); setWeeklyEventData([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, [currentUser]);
    const renderEventItem = (event) => {
        const props = event.extendedProps || {};
        const eventStyle = getEventStyle(props.type);
        let timeString = event.allDay ? "All Day" : "";
        if (!event.allDay) { try { timeString = format(parseISO(event.start), 'HH:mm'); } catch { timeString = "Invalid Time"; } }

        return (
            <React.Fragment key={event.id || `evt-${Math.random()}`}>
                <ListItem disableGutters sx={{ py: 0.5 }}>
                    <Box sx={{ width: 4, bgcolor: eventStyle.color, alignSelf: 'stretch', mr: 1.5, borderRadius: '2px' }} />
                    <ListItemText
                        primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" component="span" sx={{ flexGrow: 1 }}>{event.title || "Event"}</Typography>
                                <Chip label={eventStyle.label} size="small" sx={{ backgroundColor: eventStyle.color + '20', color: eventStyle.color, height: 18, fontSize: '0.65rem', border: `1px solid ${eventStyle.color}` }} />
                            </Stack>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary">
                                {format(parseISO(event.start), 'EEE, MMM d')} {timeString ? `- ${timeString}` : ''}
                            </Typography>
                        }
                    />
                </ListItem>
                <Divider variant="inset" component="li" sx={{ ml: 2 }} />
            </React.Fragment>
        );
    };
    const renderTaskItem = (task) => {
        const eventStyle = getEventStyle('task');
        let dueTimeString = "";
        try { dueTimeString = format(parseISO(`${task.submissionDate}T${task.submissionHour || '23:59:59'}`), 'HH:mm'); } catch { }
        return (
             <React.Fragment key={task.assignmentCode || `task-${Math.random()}`}>
                <ListItem disableGutters sx={{ py: 0.5 }}>
                     <Box sx={{ width: 4, bgcolor: eventStyle.color, alignSelf: 'stretch', mr: 1.5, borderRadius: '2px' }} />
                    <ListItemText
                        primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" component="span" sx={{ flexGrow: 1 }}>{task.assignmentName || "Task"}</Typography>
                                <Chip label="Task Due" size="small" sx={{ backgroundColor: eventStyle.color + '20', color: eventStyle.color, height: 18, fontSize: '0.65rem', border: `1px solid ${eventStyle.color}` }} />
                            </Stack>
                        }
                        secondary={
                             <Typography variant="caption" color="text.secondary">
                                Due: {format(parseISO(task.submissionDate), 'EEE, MMM d')} {dueTimeString ? `at ${dueTimeString}` : ''} ({task.courseCode || 'N/A'})
                             </Typography>
                         }
                    />
                </ListItem>
                 <Divider variant="inset" component="li" sx={{ ml: 2 }}/>
             </React.Fragment>
        );
    };
    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1200px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}> Dashboard </Typography>
            <Typography variant="h6" component="p" sx={{ mb: 4, color: 'text.secondary' }}> Welcome back, {currentUser?.firstName || currentUser?.username || 'User'}! </Typography>
            {isAdmin && (
                 <Box sx={{ mb: 4 }}>
                     <Typography variant="h6" component="div" sx={{ mb: 2 }}> System Overview </Typography>
                     <Grid container spacing={2}>
                          <StatCard title="Students" value={isLoading ? '...' : stats.studentCount} icon={PeopleIcon} />
                          <StatCard title="Courses" value={isLoading ? '...' : stats.courseCount} icon={SchoolIcon} />
                     </Grid>
                 </Box>
            )}
            <Box sx={{ mb: 4 }}>
                 <Typography variant="h6" component="div" sx={{ mb: 2 }}> Quick Actions </Typography>
                 <Grid container spacing={3}>
                     <DashboardCard title="My Timetable" to="/my-timetable" icon={CalendarMonthIcon} description="View your personal schedule." />
                     {isAdmin && ( <> <DashboardCard title="Manage Timetable" to="/manage-timetable" icon={SettingsIcon} description="Administer timetable entries." /> <DashboardCard title="Manage Students" to="/manage-students" icon={SupervisedUserCircleIcon} description="Manage student accounts." /> </> )}
                     <DashboardCard title="Help & Support" to="/help" icon={HelpOutlineIcon} description="Find answers and guides." />
                 </Grid>
            </Box>
             {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {isLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> )
                       : (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                             <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <EventIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Upcoming Events</Typography> </Stack>
                            {upcomingEvents.length > 0 ? ( <List dense disablePadding> {upcomingEvents.map(renderEventItem)} </List> )
                                                        : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No upcoming events (next 7 days).</Typography> )}
                        </Paper>
                    </Grid>
                     <Grid item xs={12} md={4}>
                         <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <TaskAltIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Upcoming Tasks</Typography> </Stack>
                             {upcomingTasks.length > 0 ? ( <List dense disablePadding> {upcomingTasks.map(renderTaskItem)} </List> )
                                                       : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No upcoming tasks (next 7 days).</Typography> )}
                         </Paper>
                     </Grid>
                      <Grid item xs={12} md={4}>
                           <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                               <Stack direction="row" spacing={1} alignItems="center" mb={1.5}> <AssessmentIcon color="action" /> <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Events This Week</Typography> </Stack>
                               {weeklyEventData.length > 0 ? (
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
                                ) : ( <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>No events found for this week.</Typography> )}
                           </Paper>
                      </Grid>
                </Grid>
            )}
        </Box>
    );
}