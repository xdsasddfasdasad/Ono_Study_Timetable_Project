// src/pages/HelpPage.jsx

import React, { useState } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Stack, Paper, Link as MuiLink } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function HelpPage() {
    const [expanded, setExpanded] = useState(false);
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };
    return (
        <Box sx={{ maxWidth: '900px', mx: 'auto', p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                 <HelpOutlineIcon color="primary" sx={{ fontSize: '2rem' }} />
                <Typography variant="h4" component="h1">
                    Help & Frequently Asked Questions
                </Typography>
            </Stack>
            <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>General</Typography>
                <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I view my timetable?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to the "My Timetable" page using the main menu. You can view your schedule in either a calendar format or a list format (use the navigation links if available). The calendar shows courses, personal events, holidays, and task deadlines.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I add a personal event?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Go to the "My Timetable" (Calendar View) page. Click on the date cell where you want to add the event, or click the "Add Personal Event" button. Fill in the details in the popup form (event name, date, time or all-day, notes) and click "Save Event".
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                 <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I edit or delete a personal event?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            On the "My Timetable" (Calendar View), click directly on the personal event you wish to modify. A popup will appear allowing you to edit the details or delete the event using the respective buttons. Note: You can only edit/delete events you created.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            </Paper>

            <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>For Administrators</Typography>
                 <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage course definitions?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            Navigate to the "Manage Timetable" page. Click the "Manage Courses" button. This will open a dedicated modal where you can select "Add New Course" or choose an existing course to edit. Fill in the course details (code, name, semester, lecturer, room, weekly schedule slots). Saving or updating will automatically generate/regenerate the individual class meetings in the main calendar based on the schedule and semester dates, avoiding holidays/vacations. Deleting a course definition here will also remove all its associated meetings.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel5'} onChange={handleChange('panel5')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage calendar entries (Holidays, Events, Tasks)?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           On the "Manage Timetable" page, click the "Add Calendar Entry" button. Select the type of entry (Holiday, Vacation, Event, Task, etc.) you want to add and fill in the form. To edit or delete existing entries (except course meetings or student events), click directly on the entry in the management calendar to open the edit modal.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                 <Accordion expanded={expanded === 'panel6'} onChange={handleChange('panel6')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage basic entities (Lecturers, Sites, Rooms)?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           On the "Manage Timetable" page, click the "Manage Entities" button. Select the entity type (Lecturer, Site, or Room) and then choose the specific record you wish to edit or delete from the second dropdown. Make your changes in the form and click "Save Changes" or use the "Delete" button.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'panel7'} onChange={handleChange('panel7')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How do I manage students?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           Navigate to the "Manage Students" page. You can see a list of all registered students. Use the "Add Student" button to create a new student account. Click on a student's name or the edit icon (<EditIcon fontSize='inherit' sx={{verticalAlign: 'middle'}}/>) to modify their details. Use the delete icon (<DeleteIcon fontSize='inherit' sx={{verticalAlign: 'middle'}}/>) to remove a student account.
                        </Typography>
                    </AccordionDetails>
                </Accordion>
                 <Accordion expanded={expanded === 'panel8'} onChange={handleChange('panel8')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>How are Years and Semesters managed?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                           Currently, editing Years and Semesters is done by clicking their start/end markers on the "Manage Timetable" calendar view. This opens a modal allowing you to adjust details and dates. Adding new Years/Semesters requires direct modification of the underlying data source or a future dedicated management interface.
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
                      <MuiLink href="mailto:admin@example.com">admin@example.com</MuiLink>.
                 </Typography>
             </Paper>

        </Box>
    );
}