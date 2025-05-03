// src/components/calendar/FullCalendarView.jsx

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
// Import MUI components for Tooltip and Link
import { Tooltip, Typography, Box, Link } from '@mui/material';

// Helper function to build the Tooltip content (React element)
const renderTooltipContent = (event) => {
    const props = event.extendedProps || {}; // Access the raw data safely
    // Format start and end times for readability
    const startStr = event.start?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) || 'N/A';
    const endStr = (event.end && event.start?.toISOString() !== event.end?.toISOString()) // Show end only if different from start
                   ? event.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })
                   : null;

    return (
        // Use MUI Box for consistent styling and padding within the tooltip
        <Box sx={{ p: 1, fontSize: '0.9em', maxWidth: 300 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{event.title}</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>Type: {props.type || 'N/A'}</Typography>
            <Typography variant="body2">Start: {startStr}</Typography>
            {endStr && <Typography variant="body2">End: {endStr}</Typography>}
            {event.allDay && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>(All Day)</Typography>}

            {/* Course Specific Details */}
            {props.type === 'courseMeeting' && (
                <>
                    {props.roomCode && <Typography variant="body2">Room: {props.roomCode}</Typography>}
                    {/* Display lecturer name if available (passed via extendedProps), otherwise ID */}
                    {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                    {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                    {/* Display clickable Zoom link */}
                    {props.zoomMeetinglink && (
                        <Typography variant="body2">
                            Zoom: <Link href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</Link>
                        </Typography>
                    )}
                </>
            )}

            {/* Display Notes if they exist for relevant types */}
            {props.notes && (props.type === 'studentEvent' || props.type === 'event' || props.type === 'holiday' || props.type === 'vacation') && (
                 <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}> {/* Keep line breaks in notes */}
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

// Helper function to render the content *inside* the event cell on the calendar
const renderEventInnerContent = (eventInfo) => {
  const props = eventInfo.event.extendedProps || {};
  const timeText = eventInfo.timeText; // Time string from FullCalendar (e.g., "14:00")
  const title = eventInfo.event.title;

  // Attempt to get lecturer name, fallback to ID
  const lecturerDisplay = props.lecturerName || (props.lecturerId ? `ID:${props.lecturerId}` : null);

  return (
    // Basic styling for the inner content
    <div style={{ fontSize: '0.85em', lineHeight: '1.25', overflow: 'hidden', whiteSpace: 'normal', padding: '1px 3px' }}>
      {/* First line: Time (if exists) and Title */}
      <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>
          {timeText && <span>{timeText} </span>}
          <span>{title}</span>
      </div>
      {/* Second line (optional): Course details */}
      {props.type === 'courseMeeting' && (
        <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
          {/* Use text icons or MUI icons if available */}
          {props.roomCode && <span title={`Room: ${props.roomCode}`}><i style={{fontStyle:'normal'}}>📍</i> {props.roomCode}</span>}
          {lecturerDisplay && <span style={{ marginLeft: '4px' }} title={`Lecturer: ${lecturerDisplay}`}>| <i style={{fontStyle:'normal'}}>🧑‍🏫</i> {lecturerDisplay}</span>}
        </div>
      )}
       {/* Optional: Small icon indicating notes exist */}
       {props.notes && (props.type === 'studentEvent' || props.type === 'event') && (
           <i title="Has notes" style={{fontSize: '0.8em', opacity: 0.6, fontStyle:'normal', marginLeft: '3px'}}>📝</i>
       )}
    </div>
  );
};


// Main FullCalendarView Component
export default function FullCalendarView({ events, onDateClick, onEventClick }) {
  console.log("[FullCalendarView] Rendering with", events?.length, "events");

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]} // Essential plugins
      initialView="dayGridMonth" // Default view on load
      events={events || []} // Event data source, fallback to empty array
      dateClick={onDateClick} // Callback when a date cell is clicked
      eventClick={onEventClick} // Callback when an event element is clicked
      headerToolbar={{ // Configure header buttons and title
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek", // View switcher options
      }}
      selectable={true} // Allow date range selection
      editable={false} // IMPORTANT: Disable direct drag-and-drop editing
      droppable={false} // Disable dropping external events
      height="auto"    // Calendar adjusts height to content
      eventTimeFormat={{ // Format for time display inside events (24-hour)
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }}
      // Custom rendering for the content INSIDE the event rectangle
      // Wraps the inner content with an MUI Tooltip for hover details
      eventContent={(eventInfo) => (
        <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
          {/* Tooltip needs a DOM element to attach to. Use a span */}
          <span style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
              {renderEventInnerContent(eventInfo)}
          </span>
        </Tooltip>
      )}
      // Add CSS classes to events based on their type for styling potential
      eventClassNames={ (arg) => {
          const type = arg.event.extendedProps?.type || 'unknown';
          const baseClass = `eventType-${type}`;
          // Add more specific classes if needed, e.g., for specific courses
          // const courseClass = type === 'courseMeeting' ? `course-${arg.event.extendedProps?.courseCode}` : '';
          return [baseClass]; // Return array of class names
      }}
      // Ensure background events like holidays don't block date clicks
      eventDisplay='auto' // Let FullCalendar decide based on event type (block vs background)
    />
  );
}