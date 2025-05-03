// src/components/calendar/FullCalendarView.jsx

import React, { useMemo } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Tooltip, Typography, Box, Link } from '@mui/material';
import { getRecords } from '../../utils/storage';


export default function FullCalendarView({ events, onDateClick, onEventClick }) {
    console.log("[FullCalendarView] Rendering with", events?.length, "events");

    const getRoomSiteMap = () => {
        console.log("[FullCalendarView:getRoomSiteMap] Creating Room -> Site map...");
        try {
            const sites = getRecords("sites") || [];
            const map = new Map();
            sites.forEach(site => {
                (site.rooms || []).forEach(room => {
                    if (room.roomCode) {
                        map.set(room.roomCode, site.siteName || `Site (${site.siteCode})`);
                    }
                });
            });
            return map;
        } catch (error) {
            console.error("[FullCalendarView:getRoomSiteMap] Error:", error);
            return new Map();
        }
    };
    const roomSiteMap = useMemo(() => getRoomSiteMap(), []);
    const renderTooltipContent = (event) => {
        const props = event.extendedProps || {};
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;
        const startStr = event.start?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) || 'N/A';
        const endStr = (event.end && event.start?.toISOString() !== event.end?.toISOString())
                       ? event.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })
                       : null;
        return (
            <Box sx={{ p: 1, fontSize: '0.9em', maxWidth: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{event.title}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Type: {props.type || 'N/A'}</Typography>
                <Typography variant="body2">Start: {startStr}</Typography>
                {endStr && <Typography variant="body2">End: {endStr}</Typography>}
                {event.allDay && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>(All Day)</Typography>}
                {props.type === 'courseMeeting' && (
                    <>
                        {props.roomCode && (
                             <Typography variant="body2">
                                 Room: {props.roomCode || 'N/A'} {siteName ? `(@ ${siteName})` : ''}
                             </Typography>
                        )}
                        {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                        {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                        {props.zoomMeetinglink && (
                            <Typography variant="body2">
                                Zoom: <Link href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</Link>
                            </Typography>
                        )}
                    </>
                )}
                {props.notes && ['studentEvent', 'event', 'holiday', 'vacation', 'task'].includes(props.type) && (
                     <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                         Notes: {props.notes}
                     </Typography>
                 )}
                {props.type === 'studentEvent' && props.studentId && (
                     <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Owner ID: {props.studentId}</Typography>
                 )}
            </Box>
        );
    };
    const renderEventInnerContent = (eventInfo) => {
        const props = eventInfo.event.extendedProps || {};
        const timeText = eventInfo.timeText; 
        const title = eventInfo.event.title;
        const lecturerDisplay = props.lecturerName || (props.lecturerId ? `ID:${props.lecturerId}` : null);
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;
        return (
            <Box sx={{ fontSize: '0.85em', lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'normal', p: '1px 3px', height: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timeText && <span>{timeText} </span>}
                    <span>{title}</span>
                </Typography>
                {props.type === 'courseMeeting' && (
                    <Typography variant="caption" component="div" sx={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {props.roomCode && (
                        <Box component="span" sx={{ mr: 0.5 }} title={`Room: ${props.roomCode}${siteName ? ` @ ${siteName}` : ''}`}>
                             <Box component="span" sx={{ mr: 0.25 }}>📍</Box>
                             {props.roomCode}
                             {siteName && ` (${siteName.substring(0, 3)}..)`}
                        </Box>
                     )}
                    {lecturerDisplay && (
                         <Box component="span" title={`Lecturer: ${lecturerDisplay}`}>
                              | <Box component="span" sx={{ mr: 0.25 }}>🧑‍🏫</Box> {lecturerDisplay}
                         </Box>
                     )}
                    </Typography>
                )}
                {props.notes && ['studentEvent', 'event', 'task', 'courseMeeting'].includes(props.type) && (
                     <Box component="span" title="Has notes" sx={{ fontSize: '0.8em', opacity: 0.7, ml: '3px' }}>📝</Box>
                 )}
            </Box>
        );
    };
    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events || []}
            dateClick={onDateClick}
            eventClick={onEventClick}
            headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            selectable={true}
            editable={false}
            droppable={false}
            height="auto"
            eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }}
            scope
            eventContent={(eventInfo) => (
                <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
                    <Box sx={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                        {renderEventInnerContent(eventInfo)}
                    </Box>
                </Tooltip>
            )}
            eventClassNames={(arg) => {
                const type = arg.event.extendedProps?.type || 'unknown';
                const classes = [`eventType-${type}`];
                if (arg.event.allDay) classes.push('fc-event-allday');
                if (arg.event.display === 'block') classes.push('fc-event-block-display');
                return classes;
            }}
            eventDisplay='auto'
            businessHours={false}
        />
    );
}