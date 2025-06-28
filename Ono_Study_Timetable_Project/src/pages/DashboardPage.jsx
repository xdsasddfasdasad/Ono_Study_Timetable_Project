import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Divider, CircularProgress, Alert, Card, Stack, FormControl, Select, MenuItem, InputLabel, TextField, LinearProgress, Skeleton } from '@mui/material'; // ✨ 1. הוספת ייבוא
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllVisibleEvents } from '../utils/getAllVisibleEvents';
import { fetchCollection } from '../firebase/firestoreService';
import { format, parseISO, compareAsc, startOfDay, endOfDay, addDays, isWithinInterval, isValid } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

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
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import MenuBookIcon from '@mui/icons-material/MenuBook';

// --- Constants & Helpers --- (נשארים ללא שינוי)
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
const toValidDate = (dateInput) => { if (!dateInput) return null; if (dateInput instanceof Date) return dateInput; if (typeof dateInput.toDate === 'function') return dateInput.toDate(); try { const date = parseISO(String(dateInput)); return isValid(date) ? date : null; } catch { return null; }};
function rangesOverlap(aStart, aEnd, bStart, bEnd) { return aStart <= bEnd && aEnd >= bStart; }

// --- Reusable Components --- (נשארים ללא שינוי)
const DashboardCard = ({ title, to, icon: IconComponent, description }) => ( <Grid item xs={12} sm={6} md={3}><Paper component={RouterLink} to={to} sx={{ textDecoration: 'none', display: 'block', p: 2, height: '100%', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, transition: 'all 0.2s ease-in-out' }}><Stack direction="row" spacing={2} alignItems="center"><IconComponent color="primary" sx={{ fontSize: 40 }} /><Box><Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography><Typography variant="body2" color="text.secondary">{description}</Typography></Box></Stack></Paper></Grid> );
const StatCard = ({ title, value, icon: IconComponent }) => ( <Grid item xs={12} sm={6} md={3}><Card elevation={2} sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}><IconComponent color="action" sx={{ fontSize: 48, mr: 2 }} /><Box><Typography variant="h5" sx={{ fontWeight: 'bold' }}>{value ?? '...'}</Typography><Typography variant="body2" color="text.secondary">{title}</Typography></Box></Card></Grid> );

// ✨ 2. קומפוננטת עזר להצגת שלד של כל הדשבורד
const DashboardSkeleton = () => (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1300px', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom><Skeleton width="40%" /></Typography>
        <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}><Skeleton width="60%" /></Typography>
        <LinearProgress sx={{ mb: 4 }} />
        
        <Box sx={{ mb: 4 }}><Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>System Overview</Typography><Grid container spacing={2}><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={80} /></Grid></Grid></Box>
        <Box sx={{ mb: 4 }}><Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Quick Actions</Typography><Grid container spacing={3}><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={100} /></Grid><Grid item xs={12} sm={6} md={3}><Skeleton variant="rounded" height={100} /></Grid></Grid></Box>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} /></Grid>
            <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} /></Grid>
            <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
        
        <Skeleton variant="rounded" height={200} />
    </Box>
);

// --- Main Component ---
export default function DashboardPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  // ✨ 3. איחוד מצבי הטעינה
  const [isLoading, setIsLoading] = useState(isLoadingAuth);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState({ events: [], tasks: [], courses: [], students: [], years: [] });
  
  const [upcomingTimeFilter, setUpcomingTimeFilter] = useState('week');
  const [upcomingCustomStart, setUpcomingCustomStart] = useState('');
  const [upcomingCustomEnd, setUpcomingCustomEnd] = useState('');

  const [summaryFilters, setSummaryFilters] = useState({ startDate: '', endDate: '', yearCode: '', semesterCode: '' });

  // --- Data Fetching ---
  useEffect(() => {
    if (isLoadingAuth) {
        setIsLoading(true);
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const loadDashboardData = async () => {
      try {
        const [events, tasks, students, courses, years] = await Promise.all([ getAllVisibleEvents(currentUser), fetchCollection('tasks'), fetchCollection('students'), fetchCollection('courses'), fetchCollection('years') ]);
        setRawData({ events: events || [], tasks: tasks || [], courses: courses || [], students: students || [], years: years || [] });
      } catch (err) { setError('Failed to load dashboard data.'); } 
      finally { setIsLoading(false); }
    };
    loadDashboardData();
  }, [currentUser, isLoadingAuth]);

  // לוגיקת החישובים והפילטרים נשארת זהה לחלוטין
  const availableSemestersForSummary = useMemo(() => { if (!summaryFilters.yearCode) return []; const selectedYear = rawData.years.find(y => y.yearCode === summaryFilters.yearCode); return selectedYear?.semesters || []; }, [summaryFilters.yearCode, rawData.years]);
  const { upcomingEvents, upcomingTasks, pieChartData, summaryData, stats } = useMemo(() => { const { events, tasks, courses, students, years } = rawData; const { startDate: fStart, endDate: fEnd, yearCode, semesterCode } = summaryFilters; const UPCOMING_EVENT_TYPES = new Set([ 'courseMeeting', 'semesterMarker', 'yearMarker', 'event', 'holiday', 'vacation', 'studentEvent' ]); const now = new Date(); let upStart = startOfDay(now), upEnd; switch (upcomingTimeFilter) { case 'today': upEnd = endOfDay(now); break; case 'month': upEnd = endOfDay(addDays(now, 30)); break; case 'custom': upStart = upcomingCustomStart ? startOfDay(toValidDate(upcomingCustomStart)) : new Date(0); upEnd = upcomingCustomEnd ? endOfDay(toValidDate(upcomingCustomEnd)) : new Date(8640000000000000); break; default: upEnd = endOfDay(addDays(now, 7)); } const upInterval = { start: isValid(upStart) ? upStart : startOfDay(now), end: isValid(upEnd) ? upEnd : endOfDay(addDays(now, 7)) }; const upcomingEvents = (events || []).filter(ev => { const type = ev.extendedProps?.type; const d = toValidDate(ev.start); return d && UPCOMING_EVENT_TYPES.has(type) && isWithinInterval(d, upInterval); }).sort((a, b) => compareAsc(toValidDate(a.start), toValidDate(b.start))); const relevantTasks = (tasks || []).filter(t => !t.studentId || t.studentId === currentUser?.uid); const upcomingTasks = relevantTasks.filter(t => { const d = toValidDate(t.submissionDate); return d && isWithinInterval(d, upInterval); }).sort((a, b) => compareAsc(toValidDate(a.submissionDate), toValidDate(b.submissionDate))); const pieCounts = upcomingEvents.reduce((acc, e) => { const type = e.extendedProps?.type || 'default'; acc[type] = (acc[type] || 0) + 1; return acc; }, {}); const pieChartData = Object.entries(pieCounts).map(([type, count]) => ({ name: getEventStyle(type).label, value: count, fill: getEventStyle(type).color })); let definitionCount = 0; if (yearCode) { const year = years.find(y => y.yearCode === yearCode); if (year) { if (semesterCode) { definitionCount = courses.filter(c => c.semesterCode === semesterCode).length; } else { const yearSemesterCodes = new Set((year.semesters || []).map(s => s.semesterCode)); definitionCount = courses.filter(c => yearSemesterCodes.has(c.semesterCode)).length; } } } else if (fStart || fEnd) { const s = fStart ? startOfDay(toValidDate(fStart)) : new Date(0); const e = fEnd ? endOfDay(toValidDate(fEnd)) : new Date(8640000000000000); const allSemesters = years.flatMap(y => y.semesters || []); const overlappingSemesters = allSemesters.filter(sem => { const semStart = toValidDate(sem.startDate); const semEnd = toValidDate(sem.endDate); return semStart && semEnd && rangesOverlap(semStart, semEnd, s, e); }); const overlappingSemesterCodes = new Set(overlappingSemesters.map(sem => sem.semesterCode)); definitionCount = courses.filter(c => overlappingSemesterCodes.has(c.semesterCode)).length; } else { definitionCount = courses.length; } let timeFilteredEvents = events; if (yearCode) { const year = years.find(y => y.yearCode === yearCode); let interval = null; if (year) { if (semesterCode) { const semester = (year.semesters || []).find(s => s.semesterCode === semesterCode); if (semester) { interval = { start: toValidDate(semester.startDate), end: toValidDate(semester.endDate) }; } } else { interval = { start: toValidDate(year.startDate), end: toValidDate(year.endDate) }; } } if (interval && isValid(interval.start) && isValid(interval.end)) { timeFilteredEvents = events.filter(ev => { const d = toValidDate(ev.start); return d && isWithinInterval(d, interval); }); } else { timeFilteredEvents = year ? [] : events; } } else if (fStart || fEnd) { const s = fStart ? startOfDay(toValidDate(fStart)) : new Date(0); const e = fEnd ? endOfDay(toValidDate(fEnd)) : new Date(8640000000000000); timeFilteredEvents = events.filter(ev => { const d = toValidDate(ev.start); return d && isWithinInterval(d, { start: s, end: e }); }); } const summaryEventCounts = timeFilteredEvents.reduce((acc, ev) => { const type = ev.extendedProps?.type || 'default'; if(type !== 'courseDefinition') { acc[type] = (acc[type] || 0) + 1; } return acc; }, {}); summaryEventCounts.courseDefinition = definitionCount; const stats = { studentCount: (students || []).length, totalCourseCount: (courses || []).length }; return { upcomingEvents, upcomingTasks, pieChartData, summaryData: summaryEventCounts, stats }; }, [rawData, summaryFilters, upcomingTimeFilter, currentUser, upcomingCustomStart, upcomingCustomEnd]);
  const handleSummaryFilterChange = (e) => { const { name, value } = e.target; setSummaryFilters(prev => { const newState = { ...prev, [name]: value, }; if (name === 'yearCode') { newState.semesterCode = ''; } return newState; }); };
  const handleUpcomingFilterChange = (e) => { setUpcomingTimeFilter(e.target.value); if (e.target.value !== 'custom') { setUpcomingCustomStart(''); setUpcomingCustomEnd(''); } };
  
  // ✨ 4. לוגיקת רינדור ראשית משופרת
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  const sortedYears = [...(rawData.years || [])].sort((a, b) => (a.yearNumber || 0) - (b.yearNumber || 0));

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1300px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}> Your central hub for managing your schedule and system data. </Typography>
      
      {/* ה-LinearProgress יופיע כחלק מה-Skeleton, ולכן אין צורך להוסיפו כאן שוב */}
      
      <Box sx={{ mb: 4 }}><Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>System Overview</Typography><Grid container spacing={2}><StatCard title="Registered Students" value={stats.studentCount} icon={PeopleIcon} /><StatCard title="Total Course Definitions" value={stats.totalCourseCount} icon={SchoolIcon} /></Grid></Box>
      <Box sx={{ mb: 4 }}><Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Quick Actions</Typography><Grid container spacing={3}><DashboardCard title="My Timetable" to="/timetable/calendar" icon={CalendarMonthIcon} description="View your full schedule." /><DashboardCard title="Manage Timetable" to="/manage-timetable" icon={SettingsIcon} description="Administer timetable entries." /><DashboardCard title="Manage Students" to="/manage-students" icon={SupervisedUserCircleIcon} description="Manage student accounts." /><DashboardCard title="Help & Support" to="/help" icon={HelpOutlineIcon} description="Find answers and guides." /></Grid></Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Upcoming</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Time Window</InputLabel>
            <Select value={upcomingTimeFilter} label="Time Window" onChange={handleUpcomingFilterChange}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Next 7 Days</MenuItem>
              <MenuItem value="month">Next 30 Days</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          {upcomingTimeFilter === 'custom' && (
            <>
              <TextField name="upcomingCustomStart" label="From" type="date" size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 150 } }} InputLabelProps={{ shrink: true }} value={upcomingCustomStart} onChange={(e) => setUpcomingCustomStart(e.target.value)} />
              <TextField name="upcomingCustomEnd" label="To" type="date" size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 150 } }} InputLabelProps={{ shrink: true }} value={upcomingCustomEnd} onChange={(e) => setUpcomingCustomEnd(e.target.value)} />
            </>
          )}
        </Stack>
      </Stack>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}><Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}><Stack direction="row" spacing={1} alignItems="center" mb={1.5}><EventIcon color="action" /><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Events</Typography></Stack><Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 250 }}>{upcomingEvents.length > 0 ? (<List dense disablePadding>{upcomingEvents.map(e => (
          <ListItem key={e.id} dense>
            <ListItemText 
              primary={e.title} 
              secondary={`${format(toValidDate(e.start), 'EEE, d MMM, HH:mm')} - ${getEventStyle(e.extendedProps?.type).label}`}
            />
          </ListItem>
        ))}</List>) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No upcoming events.</Typography>)}</Box></Paper></Grid>
        <Grid item xs={12} md={4}><Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}><Stack direction="row" spacing={1} alignItems="center" mb={1.5}><TaskAltIcon color="action" /><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Tasks</Typography></Stack><Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 250 }}>{upcomingTasks.length > 0 ? (<List dense disablePadding>{upcomingTasks.map(t => (<ListItem key={t.taskCode || t.id} dense><ListItemText primary={t.title || t.assignmentName} secondary={`Due: ${format(toValidDate(t.submissionDate), 'EEE, d MMM')}`} /></ListItem>))}</List>) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No upcoming tasks.</Typography>)}</Box></Paper></Grid>
        <Grid item xs={12} md={4}><Paper elevation={2} sx={{ p: 2, height: '100%' }}><Stack direction="row" spacing={1} alignItems="center" mb={1.5}><AssessmentIcon color="action" /><Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Upcoming Breakdown</Typography></Stack>{pieChartData.length > 0 ? (<Box sx={{ height: 250 }}><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}><Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={75} label={false}>{pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><RechartsTooltip /><Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} /></PieChart></ResponsiveContainer></Box>) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>No upcoming events to display.</Typography>)}</Paper></Grid>
      </Grid>
      
      <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}><QueryStatsIcon color="action" /><Typography variant="h6" sx={{ fontWeight: 'bold' }}>Data Summary & Analysis</Typography></Stack>
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}><TextField name="startDate" label="From" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={summaryFilters.startDate} onChange={handleSummaryFilterChange} disabled={!!summaryFilters.yearCode} /></Grid>
            <Grid item xs={12} sm={3}><TextField name="endDate" label="To" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={summaryFilters.endDate} onChange={handleSummaryFilterChange} disabled={!!summaryFilters.yearCode} /></Grid>
            <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select name="yearCode" value={summaryFilters.yearCode} label="Year" onChange={handleSummaryFilterChange}>
                        <MenuItem value=""><em>All Years</em></MenuItem>
                        {sortedYears.map(y => (<MenuItem key={y.yearCode} value={y.yearCode}>{y.yearNumber}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
                <FormControl size="small" fullWidth disabled={!summaryFilters.yearCode}>
                    <InputLabel>Semester</InputLabel>
                    <Select name="semesterCode" value={summaryFilters.semesterCode} label="Semester" onChange={handleSummaryFilterChange}>
                        <MenuItem value=""><em>Any Semester</em></MenuItem>
                        {availableSemestersForSummary.map(s => (<MenuItem key={s.semesterCode} value={s.semesterCode}>{s.semesterNumber}</MenuItem>))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {(() => {
            const items = Object.entries(summaryData);
            const itemsToShow = items.filter(([type, count]) => count > 0 || type === 'courseDefinition');
            if (itemsToShow.length === 0 || (itemsToShow.length === 1 && itemsToShow[0][0] === 'courseDefinition' && itemsToShow[0][1] === 0)) {
              return <Grid item xs={12}><Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No data for selected filters.</Typography></Grid>;
            }
            return itemsToShow.sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const style = getEventStyle(type);
              return (<Grid item xs={12} sm={6} md={4} lg={3} key={type}><Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1 }}>{style.icon}<Typography variant="h6" sx={{ fontWeight: 'bold' }}>{count}</Typography><Typography variant="body1">{style.label}</Typography></Stack></Grid>);
            });
          })()}
        </Grid>
      </Paper>
    </Box>
  );
}