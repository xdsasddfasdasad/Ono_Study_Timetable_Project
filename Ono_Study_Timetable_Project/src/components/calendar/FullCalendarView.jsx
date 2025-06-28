import React, { useState, useEffect } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Tooltip, Typography, Box, Link as MuiLink } from '@mui/material';
import { fetchCollection } from '../../firebase/firestoreService';

// מגדיר ומייצא רכיב ריאקט פונקציונלי בשם FullCalendarView.
// הרכיב מקבל כ-props: מערך של אירועים (events), ופונקציות להתמודדות עם לחיצות (onDateClick, onEventClick).
export default function FullCalendarView({ events, onDateClick, onEventClick }) {
    // מגדיר משתנה state שיחזיק Map למיפוי בין קוד חדר לשם האתר בו הוא נמצא.
    const [roomSiteMap, setRoomSiteMap] = useState(new Map());
    // מגדיר משתנה state בוליאני כדי לעקוב אחר מצב הטעינה של המיפוי.
    const [isLoadingMap, setIsLoadingMap] = useState(true); 

    // useEffect hook שרץ פעם אחת בלבד, כשהרכיב נטען לראשונה, כדי להביא ולבנות את המיפוי.
    useEffect(() => {
        // פונקציה אסינכרונית פנימית שאחראית על הלוגיקה של יצירת המיפוי.
        const createRoomSiteMap = async () => {
            // מעדכן את המצב ל'טוען' כדי שאפשר יהיה להציג חיווי טעינה במידת הצורך.
            setIsLoadingMap(true);
            // בלוק try-catch לטיפול בשגיאות רשת או עיבוד.
            try {
                // מביא את אוסף ה-'sites' מבסיס הנתונים של Firestore.
                const sites = await fetchCollection("sites");
                // יוצר אובייקט Map חדש וריק.
                const map = new Map();
                // עובר על כל האתרים שהתקבלו (עם בדיקה למקרה שהמערך ריק או null).
                (sites || []).forEach(site => {
                    // לכל אתר, עובר על מערך החדרים המשויך אליו.
                    (site.rooms || []).forEach(room => {
                        // אם לחדר יש קוד חדר...
                        if (room.roomCode) {
                            // ...מוסיף ערך ל-Map: המפתח הוא קוד החדר, והערך הוא שם האתר.
                            map.set(room.roomCode, site.siteName || `Site (${site.siteCode})`);
                        }
                    });
                });
                // מעדכן את ה-state של הרכיב עם ה-Map המלא.
                setRoomSiteMap(map);
            } catch (error) {
                // במקרה של שגיאה, מדפיס הודעה לקונסול ומאתחל את המיפוי ל-Map ריק.
                console.error("[FullCalendarView:createRoomSiteMap] Error fetching sites or creating map:", error);
                setRoomSiteMap(new Map());
            } finally {
                // בכל מקרה (הצלחה או כישלון), מסיים את מצב הטעינה.
                setIsLoadingMap(false);
            }
        };
        // קורא לפונקציה כדי להתחיל את תהליך הבאת הנתונים.
        createRoomSiteMap();
    }, []); // המערך הריק מבטיח שה-effect ירוץ רק פעם אחת.

    // פונקציה שמייצרת את תוכן ה-Tooltip (החלון הקופץ) שמופיע במעבר עכבר על אירוע.
    const renderTooltipContent = (event) => {
        // שולף את הנתונים המורחבים של האירוע.
        const props = event.extendedProps || {};
        // מחלץ את שם האתר מה-Map שנבנה קודם, אם קיים קוד חדר.
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;
        // מפרמט את תאריך ושעת ההתחלה לתצוגה קריאה.
        const startStr = event.start?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) || 'N/A';
        // מפרמט את תאריך ושעת הסיום רק אם הם שונים מתאריך ההתחלה.
        const endStr = (event.end && event.start?.toISOString() !== event.end?.toISOString())
                       ? event.end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false })
                       : null;
        // מחזיר JSX (רכיבי ריאקט) שמציגים את המידע המפורט על האירוע.
        return (
            <Box sx={{ p: 1, fontSize: '0.9em', maxWidth: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>{event.title}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Type: {props.type || 'N/A'}</Typography>
                <Typography variant="body2">Start: {startStr}</Typography>
                {endStr && <Typography variant="body2">End: {endStr}</Typography>}
                {event.allDay && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>(All Day)</Typography>}
                {/* תנאי שמציג מידע נוסף רק אם סוג האירוע הוא מפגש קורס. */}
                {props.type === 'courseMeeting' && (
                    <>
                        {props.roomCode && ( <Typography variant="body2"> Room: {props.roomCode || 'N/A'} {siteName ? `(@ ${siteName})` : ''} </Typography> )}
                        {props.lecturerName && <Typography variant="body2">Lecturer: {props.lecturerName}</Typography>}
                        {!props.lecturerName && props.lecturerId && <Typography variant="body2">Lecturer ID: {props.lecturerId}</Typography>}
                        {props.zoomMeetinglink && ( <Typography variant="body2"> Zoom: <MuiLink href={props.zoomMeetinglink} target="_blank" rel="noopener noreferrer" underline="hover" sx={{ wordBreak: 'break-all' }}>Join Meeting</MuiLink> </Typography> )}
                    </>
                )}
                {/* תנאי שמציג הערות אם קיימות, עבור סוגי אירועים ספציפיים. */}
                {props.notes && ['studentEvent', 'event', 'holiday', 'vacation', 'task', 'courseMeeting'].includes(props.type) && ( <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}> Notes: {props.notes} </Typography> )}
                {props.type === 'studentEvent' && props.studentId && ( <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Owner ID: {props.studentId}</Typography> )}
            </Box>
        );
    };

    // פונקציה שמייצרת את התוכן שמוצג *בתוך* הריבוע של האירוע בלוח השנה.
    const renderEventInnerContent = (eventInfo) => {
        // שולף את הנתונים הרלוונטיים מאובייקט המידע של האירוע.
        const props = eventInfo.event.extendedProps || {};
        const timeText = eventInfo.timeText;
        const title = eventInfo.event.title;
        const lecturerDisplay = props.lecturerName || (props.lecturerId ? `ID:${props.lecturerId}` : null);
        const siteName = props.roomCode ? roomSiteMap.get(props.roomCode) : null;

        // מחזיר JSX מעוצב שמציג את המידע החשוב ביותר בצורה קומפקטית.
        return (
            <Box sx={{ fontSize: '0.85em', lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'normal', p: '1px 3px', height: '100%' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timeText && <span>{timeText} </span>}
                    <span>{title}</span>
                </Typography>
                {/* מציג מידע נוסף וקומפקטי על החדר והמרצה עבור מפגשי קורס. */}
                {props.type === 'courseMeeting' && (
                    <Typography variant="caption" component="div" sx={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {props.roomCode && ( <Box component="span" sx={{ mr: 0.5 }} title={`Room: ${props.roomCode}${siteName ? ` @ ${siteName}` : ''}`}> <Box component="span" sx={{ mr: 0.25 }}>📍</Box> {props.roomCode} {siteName && ` (${siteName.substring(0, 3)}..)`} </Box> )}
                    {lecturerDisplay && ( <Box component="span" title={`Lecturer: ${lecturerDisplay}`}> | <Box component="span" sx={{ mr: 0.25 }}>🧑‍🏫</Box> {lecturerDisplay} </Box> )}
                    </Typography>
                )}
                {/* --- START: FIX 1 --- */}
                {/* הבעיה: הקוד המקורי לא כלל 'holiday' ו-'vacation' כאן, ולכן הם לא הציגו את אייקון הפתק. */}
                {/* התיקון: הוספנו אותם למערך. עכשיו הם יציגו את האייקון, בדיוק כמו 'event'. */}
                {/* מציג אייקון של פתק אם לאירוע יש הערות. */}
                {props.notes && ['studentEvent', 'event', 'task', 'courseMeeting', 'holiday', 'vacation'].includes(props.type) && ( 
                    <Box component="span" title="Has notes" sx={{ fontSize: '0.8em', opacity: 0.7, ml: '3px' }}>📝</Box> 
                )}
                {/* --- END: FIX 1 --- */}
            </Box>
        );
    };

    // מחזיר את רכיב ה-FullCalendar המוגדר במלואו.
    return (
        <FullCalendar
            // טוען את הפלאגינים הדרושים לתצוגות השונות ולאינטראקציה.
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            // מגדיר את תצוגת ברירת המחדל לחודש.
            initialView="dayGridMonth"
            // מקבל את מערך האירועים מה-props.
            events={events || []}
            // מקשר את פונקציות ה-callback ללחיצה על תאריך ריק או על אירוע קיים.
            dateClick={onDateClick}
            eventClick={onEventClick}
            // מגדיר את כפתורי הניווט והתצוגה בסרגל העליון.
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
            // מאפשר למשתמש לבחור טווח תאריכים.
            selectable={true}
            // מונע מהמשתמש לערוך אירועים על ידי גרירה.
            editable={false}
            droppable={false}
            // מגדיר את גובה היומן כך שיתאים את עצמו לתוכן.
            height="auto"
            // מגדיר את פורמט התצוגה של השעות ביומן (24 שעות).
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            // זוהי נקודת התאמה אישית מרכזית: היא מגדירה איך כל אירוע ירונדר.
            eventContent={(eventInfo) => (
                // עוטף את תוכן האירוע ברכיב Tooltip של Material-UI.
                <Tooltip title={renderTooltipContent(eventInfo.event)} arrow placement="top">
                    {/* תיבה שמפעילה את ה-Tooltip ומכילה את התוכן הפנימי של האירוע. */}
                    <Box sx={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}>
                        {/* קורא לפונקציה שהגדרנו קודם כדי לרנדר את התוכן הפנימי. */}
                        {renderEventInnerContent(eventInfo)}
                    </Box>
                </Tooltip>
            )}
            // פונקציה שמוסיפה שמות קלאסים (CSS classes) לאירועים לפי הסוג שלהם.
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

                // יוצר מערך של קלאסים. הקלאס הראשי מבוסס על סוג האירוע.
                const classes = [`eventType-${type}`]; 
                // מוסיף קלאס נוסף אם האירוע הוא אירוע של יום שלם.
                if (arg.event.allDay) classes.push('fc-event-allday');
                // מחזיר את מערך הקלאסים שיוחלו על האירוע.
                return classes;
            }}
            // מאפשר ליומן להציג את האירועים בצורה הטובה ביותר בהתאם למקום הפנוי.
            eventDisplay='auto'
            // מכבה את התצוגה של שעות העבודה המוגדרות כברירת מחדל.
            businessHours={false}
        />
    );
}