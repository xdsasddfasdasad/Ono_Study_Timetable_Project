// src/components/calendar/FullCalendarView.jsx

import React, { useState, useEffect } from 'react';
// Imports the main FullCalendar component and the necessary plugins for different views and interactions.
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // Plugin for month/day grid views.
import timeGridPlugin from "@fullcalendar/timegrid"; // Plugin for week/day time grid views.
import interactionPlugin from "@fullcalendar/interaction"; // Plugin for user interactions like clicking and selecting.
// Imports Material-UI components for building the custom UI within the calendar events.
import { Tooltip, Typography, Box, Link as MuiLink } from '@mui/material';
// Imports the Firestore service to fetch collections from the database.
import { fetchCollection } from '../../firebase/firestoreService';

// This component renders a fully functional calendar using the FullCalendar library.
// It's responsible for displaying events, handling user clicks, and customizing
// the appearance of events with tooltips and detailed inner content.
// Props:
// - events: An array of event objects to be displayed on the calendar.
// - onDateClick: A callback function to handle clicks on a specific date.
// - onEventClick: A callback function to handle clicks on an existing event.
export default function FullCalendarView({ events, onDateClick, onEventClick }) {
    // This state holds a Map to quickly look up a campus site name using a room's code.
    // This avoids repeatedly searching for this information when rendering events.
    const [roomSiteMap, setRoomSiteMap] = useState(new Map());
    // A loading state to track the initial fetching of the site data.
    const [isLoadingMap, setIsLoadingMap] = useState(true);

    // This useEffect hook runs once when the component first mounts.
    // Its purpose is to fetch all site and room data from Firestore and build
    // the `roomSiteMap` for efficient lookups later.
    useEffect(() => {
        // An async function to perform the data fetching and map creation.
        const createRoomSiteMap = async () => {
            setIsLoadingMap(true);
            try {
                // Fetch the 'sites' collection from the database.
                const sites = await fetchCollection("sites");
                const map = new Map();
                // Iterate over each site.
                (sites || []).forEach(site => {
                    // For each site, iterate over its associated rooms.
                    (site.rooms || []).forEach(room => {
                        // If a room has a code, add it to the map with the site's name as the value.
                        if (room.roomCode) {
                            map.set(room.roomCode, site.siteName || `Site (${site.siteCode})`);
                        }
                    });
                });
                // Update the state with the newly created map.
                setRoomSiteMap(map);
            } catch (error) {
                // In case of an error, log it and set an empty map to prevent crashes.
                console.error("[FullCalendarView:createRoomSiteMap] Error fetching sites or creating map:", error);
                setRoomSiteMap(new Map());
            } finally {
                // Ensure the loading state is turned off, regardless of success or failure.
                setIsLoadingMap(false);
            }
        };
        // Invoke the function to start the process.
        createRoomSiteMap();
    }, []); // The empty dependency array [] ensures this effect runs only once on mount.

    // This function generates the React component (JSX) for the detailed tooltip
    // that appears when a user hovers over a calendar event.
    const renderTooltipContent = (event) => {
        // Extract extended, custom properties from the event object.
        const props = event.extendedProps || {};
        // Look up the site name from our pre-built map if a room code exists.
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;
        // Format the start and end times for display.
        const startStr = event.start?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) || 'N/A';
        const endStr = (event.end && event.start?.toISOString() !== event.end?.toISOString())
            ? event.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })
            : null;

        // Return the JSX that structures the tooltip's content.
        return (
            <Box sx={{ p: 1, fontSize: '0.9em', maxWidth: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{event.title}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Type: {props.type || 'N/A'}</Typography>
                <Typography variant="body2">Start: {startStr}</Typography>
                {endStr && <Typography variant="body2">End: {endStr}</Typography>}
                {event.allDay && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>(All Day)</Typography>}
                
                {/* Conditionally render details specific to 'courseMeeting' events. */}
                {props.type === 'courseMeeting' && (
                    <>
                        {props.roomCode && ( <Typography variant="body2"> Room: {props.roomCode || 'N/A'} {siteName ? `(@ ${siteName})` : ''} </Typography> )}
                        {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                        {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                        {props.zoomMeetinglink && ( <Typography variant="body2"> Zoom: <MuiLink href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</MuiLink> </Typography> )}
                    </>
                )}

                {/* Conditionally render notes for relevant event types. */}
                {props.notes && ['studentEvent', 'event', 'holiday', 'vacation', 'task', 'courseMeeting'].includes(props.type) && ( <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}> Notes: {props.notes} </Typography> )}
                {props.type === 'studentEvent' && props.studentId && ( <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Owner ID: {props.studentId}</Typography> )}
            </Box>
        );
    };

    // This function generates the JSX for the content *inside* the event's box on the calendar grid.
    // This content needs to be very compact to fit in the small space.
    const renderEventInnerContent = (eventInfo) => {
        const props = eventInfo.event.extendedProps || {};
        const timeText = eventInfo.timeText;
        const title = eventInfo.event.title;
        const lecturerDisplay = props.lecturerName || (props.lecturerId ? `ID:${props.lecturerId}` : null);
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;

        // Returns the compact, styled JSX for inside the event.
        return (
            <Box sx={{ fontSize: '0.85em', lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'normal', p: '1px 3px', height: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timeText && <span>{timeText} </span>}
                    <span>{title}</span>
                </Typography>
                
                {/* Shows highly condensed room and lecturer info for course meetings. */}
                {props.type === 'courseMeeting' && (
                    <Typography variant="caption" component="div" sx={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {props.roomCode && ( <Box component="span" sx={{ mr: 0.5 }} title={`Room: ${props.roomCode}${siteName ? ` @ ${siteName}` : ''}`}> <Box component="span" sx={{ mr: 0.25 }}>📍</Box> {props.roomCode} {siteName && ` (${siteName.substring(0, 3)}..)`} </Box> )}
                    {lecturerDisplay && ( <Box component="span" title={`Lecturer: ${lecturerDisplay}`}> | <Box component="span" sx={{ mr: 0.25 }}>🧑‍🏫</Box> {lecturerDisplay} </Box> )}
                    </Typography>
                )}
                
                {/* Shows a note icon if the event has notes. The list of types was expanded to include
                    'holiday' and 'vacation' to ensure they also show the icon when applicable. */}
                {props.notes && ['studentEvent', 'event', 'task', 'courseMeeting', 'holiday', 'vacation'].includes(props.type) && (
                    <Box component="span" title="Has notes" sx={{ fontSize: '0.8em', opacity: 0.7, ml: '3px' }}>📝</Box>
                )}
            </Box>
        );
    };

    // This is the main return statement which renders the FullCalendar component with all our configurations.
    return (
        <FullCalendar
            // Load the necessary plugins for functionality.
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            // Set the default view to the monthly grid.
            initialView="dayGridMonth"
            // Pass the events array from props.
            events={events || []}
            // Wire up the callback props.
            dateClick={onDateClick}
            eventClick={onEventClick}
            // Configure the header toolbar with navigation and view-switching buttons.
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            // Allow users to select dates/times by clicking and dragging.
            selectable={true}
            // Disable native event dragging and resizing.
            editable={false}
            droppable={false}
            // Set the calendar's height to adjust automatically to its content.
            height="auto"
            // Use 24-hour format for time display.
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            // This is a key customization point. It defines a custom rendering function for all events.
            eventContent={(eventInfo) => (
                // We wrap our custom event content in a Material-UI Tooltip.
                <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
                    {/* The box acts as the trigger for the tooltip and contains the inner content. */}
                    <Box sx={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                        {/* Call our function to render the compact, inner content of the event. */}
                        {renderEventInnerContent(eventInfo)}
                    </Box>
                </Tooltip>
            )}
            // This function dynamically assigns CSS classes to events based on their type.
            eventClassNames={(arg) => {
                let type = arg.event.extendedProps?.type || 'unknown';

                // To create a consistent visual style, we treat 'holiday' and 'vacation'
                // as a standard 'event' for styling purposes. This ensures they share the same CSS class
                // and therefore the same background color and appearance.
                if (type === 'holiday' || type === 'vacation') {
                    type = 'event';
                }

                // Create an array of class names.
                const classes = [`eventType-${type}`];
                // Add a specific class for all-day events, which FullCalendar can use for styling.
                if (arg.event.allDay) classes.push('fc-event-allday');
                return classes;
            }}
            // Allows the calendar to display events in the most appropriate way for the available space.
            eventDisplay='auto'
            // Turns off the default "business hours" highlighting.
            businessHours={false}
        />
    );
}