import React, { useState, useCallback } from 'react';
import { Box, Typography, Grid, Paper, Link as MuiLink, Icon, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentPersonalEventFormModal from '../components/modals/forms/StudentPersonalEventFormModal';
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../handlers/formHandlers";
import { useEvents } from '../context/EventsContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EventIcon from '@mui/icons-material/Event';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const HomeActionCard = ({ title, to, icon, description, onClick }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Paper
            elevation={2}
            sx={{
                p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%',
                borderTop: 3, borderColor: 'primary.main', transition: 'all 0.3s ease',
                '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
            }}
        >
            <Icon component={icon} sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" component="div" sx={{ textAlign: 'center', mb: 1 }}> {title} </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3, flexGrow: 1 }}> {description} </Typography>
            {to ? (
                <Button component={RouterLink} to={to} variant="contained" color="primary" size="small"> Go to {title} </Button>
             ) : (
                 <Button variant="contained" color="primary" size="small" onClick={onClick}> {title} </Button>
             )}
        </Paper>
    </Grid>
);

export default function HomePage() {
    const { currentUser } = useAuth();
    const { refreshStudentEvents } = useEvents();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDefaultDate, setModalDefaultDate] = useState(null);
    const [modalError, setModalError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const isAdmin = currentUser?.id === 'admin1';
    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setModalDefaultDate(null);
        setModalError("");
        setValidationErrors({});
    }, []);

    const handleOpenQuickAdd = useCallback(() => {
        if (!currentUser) return;
        setModalDefaultDate(new Date().toISOString().split('T')[0]);
        setModalError(""); setValidationErrors({});
        setIsModalOpen(true);
    }, [currentUser]);

    const handleSavePersonalEvent = useCallback(async (formDataFromModal) => {
        setModalError(""); setValidationErrors({});
        if (!currentUser?.id) { setModalError("User not logged in."); return; }
        const actionType = "add";
        const entityKey = 'studentEvents';
        const eventDataForStorage = {
            eventCode: `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            eventName: formDataFromModal.eventName, notes: formDataFromModal.notes || "",
            startDate: formDataFromModal.date, endDate: formDataFromModal.date,
            allDay: formDataFromModal.allDay || false,
            startHour: formDataFromModal.allDay ? null : formDataFromModal.startTime,
            endHour: formDataFromModal.allDay ? null : formDataFromModal.endTime,
            studentId: currentUser.id,
        };
        try {
          const result = await handleSaveOrUpdateRecord(entityKey, eventDataForStorage, actionType, { recordType: 'studentEvent' });
          if (result.success) {
            handleCloseModal();
            if (typeof refreshStudentEvents === 'function') { refreshStudentEvents(); }
            alert("Personal event added successfully!");
          } else {
            setValidationErrors(result.errors || {});
            setModalError(result.message || `Failed to add event.`);
          }
        } catch (error) {
           setModalError(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
           console.error("[HomePage] Error saving personal event:", error);
        }
    }, [currentUser, handleCloseModal, refreshStudentEvents]);


    if (!currentUser) {
        return ( <Box sx={{ p: 3, textAlign: 'center' }}> <Typography>Loading user data or not logged in...</Typography> <MuiLink component={RouterLink} to="/login">Go to Login</MuiLink> </Box> );
    }

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: '1200px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 1 }}> Welcome, {currentUser.firstName || currentUser.username}! </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 5 }}> Your central hub for managing your schedule. </Typography>
            <Typography variant="h6" component="div" sx={{ mb: 2 }}> Quick Actions </Typography>
            <Grid container spacing={4}>
                 <HomeActionCard title="My Timetable" description="View your weekly schedule." icon={CalendarMonthIcon} to="/my-timetable" color="primary" />
                 <HomeActionCard title="Timetable List" description="See upcoming items in a list." icon={FormatListBulletedIcon} to="/timetable/list" color="primary" />
                 <HomeActionCard title="Dashboard" description="Overview and statistics." icon={DashboardIcon} to="/dashboard" color="primary" />
                  <HomeActionCard title="Manage Timetable" description="Administer calendar entries." icon={SettingsIcon} to="/manage-timetable" color="secondary" />
                  <HomeActionCard title="Manage Courses" description="Define courses and schedules." icon={SchoolIcon} to="/manage-timetable" color="secondary" />
                  <HomeActionCard title="Manage Students" description="Handle student accounts." icon={SupervisedUserCircleIcon} to="/manage-students" color="secondary" />
                 <HomeActionCard title="Quick Add Event" description="Add a personal event to your calendar." icon={AddCircleOutlineIcon} onClick={handleOpenQuickAdd} color="success" />
            </Grid>
            {isModalOpen && (
                <StudentPersonalEventFormModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSavePersonalEvent}
                    onDelete={()=>{}}
                    initialData={null} 
                    defaultDate={modalDefaultDate}
                    errorMessage={modalError}
                    validationErrors={validationErrors}
                />
             )}
        </Box>
    );
}