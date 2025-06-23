// src/components/agent/AIFunctionHandler.jsx

import { fetchEventsForAI } from '../../utils/getAllVisibleEvents';
import { fetchStudentCoursesForSemester, queryCourses } from '../../utils/academicInfoService';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale'; // ייבוא הלוקליזציה העברית

// מילון תרגום לסוגי אירועים
const eventTypeTranslation = {
    courseMeeting: 'מפגש קורס',
    studentEvent: 'אירוע אישי',
    holiday: 'חג',
    vacation: 'חופשה',
    event: 'אירוע כללי',
    task: 'מטלה להגשה',
    yearMarker: 'ציון שנת לימודים',
    semesterMarker: 'ציון סמסטר',
    course: 'קורס',
    default: 'אחר'
};
const translateEventType = (type) => eventTypeTranslation[type] || eventTypeTranslation.default;

// פונקציית עזר חדשה לעיצוב פרטי אירוע
const formatEventDetailsToString = (event) => {
    let details = [];
    try {
        if (event.allDay) {
            details.push("אירוע של יום שלם");
        } else if (event.start) {
            const startTime = format(parseISO(event.start), 'HH:mm');
            const endTime = event.end ? format(parseISO(event.end), 'HH:mm') : '';
            if (startTime && endTime && startTime !== endTime) {
                details.push(`שעות: ${startTime} - ${endTime}`);
            } else if (startTime) {
                details.push(`שעה: ${startTime}`);
            }
        }
    } catch (e) {
        console.warn("Could not format time for event:", event, e);
    }
    
    switch (event.type) {
        case 'courseMeeting':
            if (event.lecturerName) details.push(`מרצה: ${event.lecturerName}`);
            if (event.roomName) details.push(`מיקום: ${event.roomName}${event.siteName ? ` (${event.siteName})` : ''}`);
            if (event.zoomMeetinglink) details.push("קישור לזום זמין");
            break;
        case 'task':
            if (event.courseName) details.push(`קורס: ${event.courseName}`);
            else if (event.courseCode) details.push(`קורס: ${event.courseCode}`);
            break;
    }

    if (event.notes) details.push(`הערות: ${event.notes}`);
    return details.length > 0 ? ` (${details.join(' | ')})` : '';
};


export const handleAIFunctionCall = async (toolCall, currentUser) => {
    const functionName = toolCall.name;
    const args = toolCall.args;

    if (!currentUser) return { error: "User not logged in." };

    switch (functionName) {
        case 'getCalendarEvents':
            try {
                const result = await fetchEventsForAI(currentUser, args.startDate, args.endDate);
                if (result.error) return { error: result.error };

                if (result.events && result.events.length > 0) {
                    
                    // ✨ FIX: Restore the grouping-by-date logic
                    const groupedByDate = result.events.reduce((acc, event) => {
                        const dateKey = format(parseISO(event.start), 'yyyy-MM-dd');
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(event);
                        return acc;
                    }, {});

                    let responseText = `מצאתי ${result.events.length} אירועים עבורך בין ${args.startDate} ל-${args.endDate}:\n\n`;
                    
                    // Sort the dates chronologically and build the response
                    Object.keys(groupedByDate).sort().forEach(dateKey => {
                        // Format the date as a header, e.g., "יום ראשון, 22 ביוני 2025"
                        const formattedDate = format(parseISO(dateKey), "EEEE, d 'ב'MMMM yyyy", { locale: he });
                        responseText += `**${formattedDate}**:\n`;
                        
                        // Add each event for that day
                        groupedByDate[dateKey].forEach(event => {
                            const eventTypeString = `[${translateEventType(event.type)}]`;
                            responseText += `- ${eventTypeString} ${event.title || 'ללא שם'}${formatEventDetailsToString(event)}\n`;
                        });
                        
                        responseText += "\n"; // Add a space after each day's events
                    });
                    
                    return { content: responseText };
                } else {
                    return { content: `לא מצאתי אירועים רשומים עבורך בין ${args.startDate} ל-${args.endDate}.` };
                }
            } catch (error) {
                return { error: `Error fetching events: ${error.message}` };
            }

        case 'getStudentCourses':
             try {
                const result = await fetchStudentCoursesForSemester(currentUser, args.semesterCode);
                if (result.error) {
                    return { error: result.error };
                }
                if (result.courses && result.courses.length > 0) {
                    let responseText = `בסמסטר ${result.semesterCode || 'הנוכחי'}, את/ה רשום/ה ל-${result.count} קורסים:\n`;
                    result.courses.forEach(course => {
                        responseText += `- ${course.courseName} (קוד: ${course.courseCode})\n`;
                    });
                    // ✨ FIX: Return ONLY the content object
                    return { content: responseText };
                } else {
                    return { content: `לא נמצאו קורסים המשויכים אלייך לסמסטר ${result.semesterCode || 'הנוכחי'}.` };
                }
             } catch (error) {
                return { error: `Error fetching courses: ${error.message}` };
             }
            
        case 'getCourseDefinitions':
            try {
                // The 'queryCourses' function already supports filtering by semesterCode
                const result = await queryCourses({ semesterCode: args.semesterCode });
                if (result.error) {
                    return { error: result.error };
                }

                if (result.courses && result.courses.length > 0) {
                    let responseText = `מצאתי ${result.count} הגדרות קורס`;
                    if (args.semesterCode) {
                        responseText += ` עבור סמסטר ${args.semesterCode}`;
                    }
                    responseText += ':\n';
                    result.courses.forEach(course => {
                        responseText += `- ${course.courseName} (קוד: ${course.courseCode})\n`;
                    });
                    return { content: responseText };
                } else {
                    return { content: `לא מצאתי הגדרות קורס עבור הקריטריונים שצוינו.` };
                }
            } catch (error) {
                return { error: `Error fetching course definitions: ${error.message}` };
            }
            
        default:
            return { error: `Function '${functionName}' is not recognized.` };
    }
};