import React, { useState } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Stack, Paper, Link as MuiLink } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function HelpPage() {
    const [expanded, setExpanded] = useState(false);
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Box sx={{ maxWidth: '900px', mx: 'auto', p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                 <HelpOutlineIcon color="primary" sx={{ fontSize: '2.2rem' }} />
                <Typography variant="h4" component="h1">
                    Help & Frequently Asked Questions
                </Typography>
            </Stack>

            <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>General Usage</Typography>
                
                <Accordion expanded={expanded === 'panel_dashboard'} onChange={handleChange('panel_dashboard')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1} alignItems="center"><DashboardIcon color="action"/><Typography>What is the Dashboard?</Typography></Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            The Dashboard is your landing page, providing a quick overview of the system. It includes:
                        </Typography>
                        <ul>
                            <li><Typography component="span"><b>System Overview:</b> Key statistics like the number of registered students and defined courses.</Typography></li>
                            <li><Typography component="span"><b>Quick Actions:</b> Direct links to the most common pages.</Typography></li>
                            <li><Typography component="span"><b>Upcoming Section:</b> A list of your upcoming events and tasks. You can filter this view to see what's happening today, in the next 7 days, or in the next 30 days.</Typography></li>
                            <li><Typography component="span"><b>Data Summary & Analysis:</b> An advanced panel allowing you to get a count of different event types based on date ranges, academic year, and semester.</Typography></li>
                        </ul>
                    </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I view my timetable?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to the "My Timetable" page. You have two main views:
                        </Typography>
                        <ul>
                            <li><Typography component="span"><b>Calendar View:</b> A visual, interactive calendar showing your schedule.</Typography></li>
                            <li><Typography component="span"><b>List View:</b> A detailed, filterable list of all your events. You can use the powerful filter options at the top to search by type, course, year, semester, day of the week, and date range.</Typography></li>
                        </ul>
                    </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I add a personal event?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            You can add a personal event from either the "Calendar View" or the "List View" of your timetable. Click the "Add Personal Event" button, fill in the details in the popup form (event name, date, time, etc.), and click "Save".
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                 <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I edit or delete a personal event?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            On the <b>Calendar View</b>, click directly on the event. On the <b>List View</b>, click on the event's list item. In both cases, a popup will appear allowing you to edit the details or delete the event. You can only modify events that you have created.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Paper>

            <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>For Administrators</Typography>
                
                 <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage courses?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to "Manage Timetable" and click "Manage Courses". Here you can add a new course or edit an existing one. When you define a course's schedule (e.g., Mondays and Wednesdays at 10:00) and link it to a semester, the system will **automatically generate** all the individual class meetings for that entire semester, smartly avoiding any holidays or vacations already on the calendar.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage general calendar entries (Holidays, Tasks)?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           From the "Manage Timetable" page, click the "Add Calendar Entry" button. Select the entry type (Holiday, Event, Task, etc.) and fill out the form. To edit an existing entry, simply click on it in the management calendar to open the editing form.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                 <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How are basic entities (Lecturers, Sites) managed?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           From the "Manage Timetable" page, click "Manage Entities". A modal will appear where you can select the entity type you wish to manage (like Lecturers or Sites), and then add new ones or select existing ones to edit or delete.
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage students?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           Navigate to the "Manage Students" page. Here you will find a list of all registered students. You can create a new student account using the "Add Student" button, or click the edit (<EditIcon fontSize='inherit' sx={{verticalAlign: 'middle'}}/>) or delete (<DeleteIcon fontSize='inherit' sx={{verticalAlign: 'middle'}}/>) icons next to a student's name to manage their record.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Paper>

             <Paper elevation={2} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <ContactSupportIcon color="action" />
                     <Typography variant="h6">Need More Help?</Typography>
                  </Stack>
                 <Typography variant="body2">
                      If you encounter issues or have questions not covered here, please contact the system administrator at{' '}
                      <MuiLink href="mailto:support@example.com">support@example.com</MuiLink>.
                 </Typography>
             </Paper>
        </Box>
    );
}