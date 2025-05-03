// src/components/calendar/FullCalendarView.jsx

// ✅ Import React hooks and utils correctly
import React, { useMemo } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Tooltip, Typography, Box, Link } from '@mui/material';
import { getRecords } from '../../utils/storage'; // ✅ Import getRecords

// --- Main FullCalendarView Component ---
export default function FullCalendarView({ events, onDateClick, onEventClick }) {
    console.log("[FullCalendarView] Rendering with", events?.length, "events");

    // --- ✅ Define Helper Functions INSIDE the component ---

    // Helper to create Room -> Site mapping
    const getRoomSiteMap = () => {
        console.log("[FullCalendarView:getRoomSiteMap] Creating Room -> Site map...");
        try {
            const sites = getRecords("sites") || []; // Use imported getRecords
            const map = new Map();
            sites.forEach(site => {
                (site.rooms || []).forEach(room => {
                    if (room.roomCode) { // Ensure roomCode exists
                        map.set(room.roomCode, site.siteName || `Site (${site.siteCode})`);
                    }
                });
            });
            return map;
        } catch (error) {
            console.error("[FullCalendarView:getRoomSiteMap] Error:", error);
            return new Map(); // Return empty map on error
        }
    };

    // Memoize the room-site map so it's created only once per render cycle (or if deps change)
    const roomSiteMap = useMemo(() => getRoomSiteMap(), []); // Empty dependency array - create once

    // Helper function to build the Tooltip content
    // Now receives roomSiteMap from the component's scope
    const renderTooltipContent = (event) => {
        const props = event.extendedProps || {};
        // ✅ Access roomSiteMap directly from the outer scope
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;
        const startStr = event.start?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) || 'N/A';
        const endStr = (event.end && event.start?.toISOString() !== event.end?.toISOString())
                       ? event.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })
                       : null;

        return (
            <Box sx={{ p: 1, fontSize: '0.9em', maxWidth: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{event.title}</Typography>
                {/* Display Type - Use consistent 'type' from extendedProps */}
                <Typography variant="body2" sx={{ mb: 0.5 }}>Type: {props.type || 'N/A'}</Typography>
                <Typography variant="body2">Start: {startStr}</Typography>
                {endStr && <Typography variant="body2">End: {endStr}</Typography>}
                {event.allDay && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>(All Day)</Typography>}

                {/* Course Specific Details */}
                {props.type === 'courseMeeting' && (
                    <>
                        {/* Display Room and Site */}
                        {props.roomCode && (
                             <Typography variant="body2">
                                 Room: {props.roomCode || 'N/A'} {siteName ? `(@ ${siteName})` : ''}
                             </Typography>
                        )}
                        {/* Display Lecturer */}
                        {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                        {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                        {/* Display Zoom Link */}
                        {props.zoomMeetinglink && (
                            <Typography variant="body2">
                                Zoom: <Link href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</Link>
                            </Typography>
                        )}
                    </>
                )}

                {/* Display Notes for relevant types */}
                {props.notes && ['studentEvent', 'event', 'holiday', 'vacation', 'task'].includes(props.type) && (
                     <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                         Notes: {props.notes}
                     </Typography>
                 )}

                {/* Display Owner ID for personal events */}
                {props.type === 'studentEvent' && props.studentId && (
                     <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Owner ID: {props.studentId}</Typography>
                 )}
            </Box>
        );
    };

    // Helper function to render the content *inside* the event cell
    // Also receives roomSiteMap implicitly from the component's scope
    const renderEventInnerContent = (eventInfo) => {
        const props = eventInfo.event.extendedProps || {};
        const timeText = eventInfo.timeText; // e.g., "14:00"
        const title = eventInfo.event.title;

        // Prefer displaying name over ID for lecturer
        const lecturerDisplay = props.lecturerName || (props.lecturerId ? `ID:${props.lecturerId}` : null);
        // ✅ Access roomSiteMap directly
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;

        return (
            // Use sx prop for styling with MUI system if preferred over inline styles
            <Box sx={{ fontSize: '0.85em', lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'normal', p: '1px 3px', height: '100%' }}>
                {/* First line: Time and Title */}
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timeText && <span>{timeText} </span>}
                    <span>{title}</span>
                </Typography>
                {/* Second line (optional): Course details */}
                {props.type === 'courseMeeting' && (
                    <Typography variant="caption" component="div" sx={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {/* Display Room and Short Site Name */}
                    {props.roomCode && (
                        <Box component="span" sx={{ mr: 0.5 }} title={`Room: ${props.roomCode}${siteName ? ` @ ${siteName}` : ''}`}>
                             <Box component="span" sx={{ mr: 0.25 }}>📍</Box> {/* Emoji or Icon */}
                             {props.roomCode}
                             {siteName && ` (${siteName.substring(0, 3)}..)`} {/* Short site name */}
                        </Box>
                     )}
                    {/* Display Lecturer */}
                    {lecturerDisplay && (
                         <Box component="span" title={`Lecturer: ${lecturerDisplay}`}>
                              | <Box component="span" sx={{ mr: 0.25 }}>🧑‍🏫</Box> {lecturerDisplay}
                         </Box>
                     )}
                    </Typography>
                )}
                {/* Notes icon */}
                {props.notes && ['studentEvent', 'event', 'task', 'courseMeeting'].includes(props.type) && ( // Added task/courseMeeting
                     <Box component="span" title="Has notes" sx={{ fontSize: '0.8em', opacity: 0.7, ml: '3px' }}>📝</Box>
                 )}
            </Box>
        );
    };

    // --- Return the FullCalendar Component ---
    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events || []}
            dateClick={onDateClick}    // Callback for clicking on a date cell
            eventClick={onEventClick}  // Callback for clicking on an event
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            selectable={true}          // Allow date range selection
            editable={false}           // IMPORTANT: Disable direct drag-and-drop editing via UI
            droppable={false}          // Disable dropping external events
            height="auto"              // Adjust height automatically
            eventTimeFormat={{        // Use 24-hour format
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }}
            // Custom rendering for the content INSIDE the event rectangle
            // Use the helper functions defined within this component's scope
            eventContent={(eventInfo) => (
                <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
                    {/* Tooltip needs a DOM element child */}
                    <Box sx={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                        {renderEventInnerContent(eventInfo)}
                    </Box>
                </Tooltip>
            )}
            // Add CSS classes based on event type for styling potential
            eventClassNames={(arg) => {
                const type = arg.event.extendedProps?.type || 'unknown';
                const classes = [`eventType-${type}`];
                if (arg.event.allDay) classes.push('fc-event-allday');
                if (arg.event.display === 'block') classes.push('fc-event-block-display');
                // Add more specific classes if needed
                return classes;
            }}
            // Let FullCalendar handle display (block vs background vs default)
            eventDisplay='auto'
            // Ensure date clicks work even with background events
            businessHours={false} // Or define business hours if needed
        />
    );
}