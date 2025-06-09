import React, { useState, useEffect } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Tooltip, Typography, Box, Link as MuiLink } from '@mui/material';
import { fetchCollection } from '../../firebase/firestoreService';

export default function FullCalendarView({ events, onDateClick, onEventClick }) {
    const [roomSiteMap, setRoomSiteMap] = useState(new Map());
    const [isLoadingMap, setIsLoadingMap] = useState(true); 

    useEffect(() => {
        const createRoomSiteMap = async () => {
            setIsLoadingMap(true);
            try {
                const sites = await fetchCollection("sites");
                const map = new Map();
                (sites || []).forEach(site => {
                    (site.rooms || []).forEach(room => {
                        if (room.roomCode) {
                            map.set(room.roomCode, site.siteName || `Site (${site.siteCode})`);
                        }
                    });
                });
                setRoomSiteMap(map);
            } catch (error) {
                console.error("[FullCalendarView:createRoomSiteMap] Error fetching sites or creating map:", error);
                setRoomSiteMap(new Map());
            } finally {
                setIsLoadingMap(false);
            }
        };
        createRoomSiteMap();
    }, []);

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
                        {props.roomCode && ( <Typography variant="body2"> Room: {props.roomCode || 'N/A'} {siteName ? `(@ ${siteName})` : ''} </Typography> )}
                        {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                        {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                        {props.zoomMeetinglink && ( <Typography variant="body2"> Zoom: <MuiLink href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</MuiLink> </Typography> )}
                    </>
                )}
                {props.notes && ['studentEvent', 'event', 'holiday', 'vacation', 'task', 'courseMeeting'].includes(props.type) && ( <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}> Notes: {props.notes} </Typography> )}
                {props.type === 'studentEvent' && props.studentId && ( <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Owner ID: {props.studentId}</Typography> )}
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
                    {props.roomCode && ( <Box component="span" sx={{ mr: 0.5 }} title={`Room: ${props.roomCode}${siteName ? ` @ ${siteName}` : ''}`}> <Box component="span" sx={{ mr: 0.25 }}>📍</Box> {props.roomCode} {siteName && ` (${siteName.substring(0, 3)}..)`} </Box> )}
                    {lecturerDisplay && ( <Box component="span" title={`Lecturer: ${lecturerDisplay}`}> | <Box component="span" sx={{ mr: 0.25 }}>🧑‍🏫</Box> {lecturerDisplay} </Box> )}
                    </Typography>
                )}
                {/* --- START: FIX 1 --- */}
                {/* הבעיה: הקוד המקורי לא כלל 'holiday' ו-'vacation' כאן, ולכן הם לא הציגו את אייקון הפתק. */}
                {/* התיקון: הוספנו אותם למערך. עכשיו הם יציגו את האייקון, בדיוק כמו 'event'. */}
                {props.notes && ['studentEvent', 'event', 'task', 'courseMeeting', 'holiday', 'vacation'].includes(props.type) && ( 
                    <Box component="span" title="Has notes" sx={{ fontSize: '0.8em', opacity: 0.7, ml: '3px' }}>📝</Box> 
                )}
                {/* --- END: FIX 1 --- */}
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
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            selectable={true}
            editable={false}
            droppable={false}
            height="auto"
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventContent={(eventInfo) => (
                <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
                    <Box sx={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                        {renderEventInnerContent(eventInfo)}
                    </Box>
                </Tooltip>
            )}
            eventClassNames={(arg) => {
                let type = arg.event.extendedProps?.type || 'unknown';
                
                // --- START: FIX 2 ---
                // הבעיה: הקוד המקורי נתן קלאס ייחודי ל'holiday' ו'vacation', מה שגרם לעיצוב שונה.
                // התיקון: אנחנו מאחדים אותם. אם הסוג הוא חג או חופשה, אנחנו מתייחסים אליו כאל 'event'
                // לצורך קביעת העיצוב (CSS class). זה מאלץ אותם לקבל את אותו עיצוב כמו אירוע רגיל.
                if (type === 'holiday' || type === 'vacation') {
                    type = 'event';
                }
                // --- END: FIX 2 ---

                const classes = [`eventType-${type}`]; 
                if (arg.event.allDay) classes.push('fc-event-allday');
                return classes;
            }}
            eventDisplay='auto'
            businessHours={false}
        />
    );
}