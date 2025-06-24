// src/components/agent/AIFunctionHandler.jsx

import { fetchEventsForAI } from '../../utils/getAllVisibleEvents';
import { fetchStudentCoursesForSemester, queryCourses } from '../../utils/academicInfoService';
import { fetchCollection } from '../../firebase/firestoreService';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';

// מילון תרגום
const eventTypeTranslation = {
    courseMeeting: 'מפגש קורס',
    studentEvent: 'אירוע אישי',
    holiday: 'חג',
    vacation: 'חופשה',
    event: 'אירוע כללי',
    task: 'מטלה',
    yearMarker: 'ציון דרך - שנה',
    semesterMarker: 'ציון דרך - סמסטר',
    course: 'קורס',
    lecturer: 'מרצה',
    site: 'אתר (קמפוס)',
    room: 'חדר',
    default: 'אחר'
};
const translateEventType = (type) => eventTypeTranslation[type] || eventTypeTranslation.default;

// פונקציית עזר לעיצוב פרטי אירוע
const formatEventDetailsToString = (event) => {
    let details = [];
    try {
        if (event.allDay) {
            // No time needed for all-day events
        } else if (event.start) {
            const startTime = format(parseISO(event.start), 'HH:mm');
            const endTime = event.end && !isSameDay(parseISO(event.start), parseISO(event.end)) 
                ? format(parseISO(event.end), 'HH:mm dd/MM') // Show date if different day
                : (event.end ? format(parseISO(event.end), 'HH:mm') : '');
                
            if (startTime && endTime && startTime !== endTime) {
                details.push(`🕒 ${startTime} - ${endTime}`);
            } else if (startTime) {
                details.push(`🕒 ${startTime}`);
            }
        }
    } catch (e) {
        console.warn("Could not format time for event:", event, e);
    }
    
    switch (event.type) {
        case 'courseMeeting':
            if (event.lecturerName) details.push(`👨‍🏫 ${event.lecturerName}`);
            if (event.roomName) details.push(`📍 ${event.roomName}${event.siteName ? ` (${event.siteName})` : ''}`);
            break;
        case 'task':
            if (event.courseName) details.push(`📚 ${event.courseName}`);
            else if (event.courseCode) details.push(`📚 ${event.courseCode}`);
            break;
    }

    if (event.notes) {
        details.push(`📝 ${event.notes}`);
    }

    return details.length > 0 ? `\n   - ${details.join(' | ')}` : '';
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
                    
                    const groupedByDate = result.events.reduce((acc, event) => {
                        try {
                            const start = parseISO(event.start);
                            const end = event.end ? parseISO(event.end) : start;
                            
                            // For multi-day events that are not all-day (e.g., overnight),
                            // we still want to primarily group by the start day.
                            // For all-day events, we expand them.
                            if (event.allDay) {
                                const daysInInterval = eachDayOfInterval({ start, end });
                                daysInInterval.forEach(day => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    if (!acc[dateKey].some(e => e.id === event.id)) {
                                        acc[dateKey].push(event);
                                    }
                                });
                            } else {
                                const dateKey = format(start, 'yyyy-MM-dd');
                                if (!acc[dateKey]) acc[dateKey] = [];
                                acc[dateKey].push(event);
                            }
                        } catch (e) {
                            console.error("Failed to process event interval:", event, e);
                        }
                        return acc;
                    }, {});

                    let responseText = `מצאתי ${result.events.length} אירועים עבורך בין ${args.startDate} ל-${args.endDate}:\n\n`;
                    
                    Object.keys(groupedByDate).sort().forEach(dateKey => {
                        const formattedDate = format(parseISO(dateKey), "EEEE, d 'ב'MMMM yyyy", { locale: he });
                        responseText += `**${formattedDate}**:\n`;
                        
                        groupedByDate[dateKey].sort((a,b) => a.start.localeCompare(b.start)).forEach(event => {
                            const eventTypeString = `[${translateEventType(event.type)}]`;
                            responseText += `- ${eventTypeString} ${event.title || 'ללא שם'}${formatEventDetailsToString(event)}\n`;
                        });
                        
                        responseText += "\n";
                    });
                    
                    return { content: responseText };
                } else {
                    return { content: `לא מצאתי אירועים עבורך בין ${args.startDate} ל-${args.endDate}.` };
                }
            } catch (error) {
                return { error: `Error fetching events: ${error.message}` };
            }

        // ... (The other cases are restored and correct)
        case 'getStudentCourses':
            try {
                const result = await fetchStudentCoursesForSemester(currentUser, args.semesterCode);
                if (result.error) return { error: result.error };
                if (result.courses && result.courses.length > 0) {
                    let responseText = `בסמסטר ${result.semesterCode || 'הנוכחי'}, את/ה רשום/ה ל-${result.count} קורסים:\n`;
                    result.courses.forEach(course => {
                        responseText += `- ${course.courseName} (קוד: ${course.courseCode})\n`;
                    });
                    return { content: responseText };
                } else {
                    return { content: `לא נמצאו קורסים המשויכים אלייך לסמסטר ${result.semesterCode || 'הנוכחי'}.` };
                }
             } catch (error) {
                return { error: `Error fetching courses: ${error.message}` };
             }
        
        case 'getCourseDefinitions':
            try {
                const [allCoursesResult, allLecturers] = await Promise.all([
                    queryCourses({ semesterCode: args.semesterCode, courseName: args.courseName }),
                    fetchCollection('lecturers')
                ]);

                if (allCoursesResult.error) return { error: allCoursesResult.error };

                const lecturersMap = new Map((allLecturers || []).map(l => [l.id, l.name]));
                let finalCourses = allCoursesResult.courses;
                
                if (args.courseName) {
                    finalCourses = finalCourses.filter(c => 
                        c.courseName.toLowerCase().includes(args.courseName.toLowerCase())
                    );
                }
                
                const enrichedCourses = finalCourses.map(course => ({
                    ...course,
                    lecturerName: lecturersMap.get(course.lecturerId) || 'לא ידוע'
                }));

                if (enrichedCourses.length > 0) {
                    let responseText = `מצאתי ${enrichedCourses.length} קורסים תואמים:\n\n`;
                    enrichedCourses.forEach(course => {
                        responseText += `**${course.courseName} (קוד: ${course.courseCode})**\n`;
                        responseText += `  - מרצה: ${course.lecturerName}\n`;
                        responseText += `  - סמסטר: ${course.semesterCode}\n`;
                        if (course.notes) responseText += `  - הערות: ${course.notes}\n`;
                        responseText += '\n';
                    });
                    return { content: responseText };
                } else {
                    return { content: `לא מצאתי הגדרות קורס עבור הקריטריונים שצוינו.` };
                }

            } catch (error) {
                return { error: `Error fetching course definitions: ${error.message}` };
            }
        
        case 'getLecturerInfo':
            try {
                const lecturers = await fetchCollection('lecturers');
                let result = lecturers;
                if (args.name) {
                    result = lecturers.filter(l => l.name.toLowerCase().includes(args.name.toLowerCase()));
                }
                if (result.length > 0) {
                    let responseText = `מצאתי ${result.length} מרצים:\n`;
                    result.forEach(l => {
                        responseText += `- ${l.name} (ID: ${l.id}, Email: ${l.email || 'N/A'})\n`;
                    });
                    return { content: responseText };
                } else {
                    return { content: `לא מצאתי מרצים התואמים לחיפוש "${args.name}".` };
                }
            } catch (error) {
                return { error: `Error fetching lecturers: ${error.message}` };
            }

        case 'getSiteAndRoomInfo':
            try {
                const sites = await fetchCollection('sites');
                let responseText = '';
                if (args.roomCode) {
                    let foundRoom = null, foundSite = null;
                    for (const site of sites) {
                        const room = (site.rooms || []).find(r => r.roomCode.toLowerCase() === args.roomCode.toLowerCase());
                        if (room) { foundRoom = room; foundSite = site; break; }
                    }
                    if (foundRoom) {
                        responseText = `חדר ${foundRoom.roomName} (קוד: ${foundRoom.roomCode}) נמצא באתר ${foundSite.siteName}.`;
                        if (foundRoom.notes) responseText += ` הערות: ${foundRoom.notes}`;
                    } else {
                        responseText = `לא מצאתי חדר עם הקוד "${args.roomCode}".`;
                    }
                } else {
                    responseText = 'רשימת האתרים והחדרים במערכת:\n\n';
                    sites.forEach(site => {
                        responseText += `**${site.siteName} (קוד: ${site.siteCode})**\n`;
                        (site.rooms || []).forEach(room => {
                            responseText += `  - חדר: ${room.roomName} (קוד: ${room.roomCode})\n`;
                        });
                        responseText += '\n';
                    });
                }
                return { content: responseText };
            } catch (error) {
                return { error: `Error fetching sites and rooms: ${error.message}` };
            }
            
        default:
            return { error: `Function '${functionName}' is not recognized.` };
    }
};