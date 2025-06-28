// src/components/agent/AIFunctionHandler.jsx

// --- Imports ---
// Utility function to fetch calendar events visible to the AI.
import { fetchEventsForAI } from '../../utils/getAllVisibleEvents';
// Utility functions for fetching academic information like courses.
import { fetchStudentCoursesForSemester, queryCourses } from '../../utils/academicInfoService';
// A generic service to fetch data from a specified Firestore collection.
import { fetchCollection } from '../../firebase/firestoreService';
// Date utility functions for formatting, parsing, and handling intervals.
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
// Hebrew locale for date-fns to format dates in Hebrew.
import { he } from 'date-fns/locale';

// --- Constants and Helper Functions ---

// This dictionary translates internal event type identifiers (e.g., 'courseMeeting')
// into human-readable Hebrew strings for displaying to the user.
const eventTypeTranslation = {
    courseMeeting: 'מפגש קורס', // Course Meeting
    studentEvent: 'אירוע אישי', // Personal Event
    holiday: 'חג', // Holiday
    vacation: 'חופשה', // Vacation
    event: 'אירוע כללי', // General Event
    task: 'מטלה', // Task
    yearMarker: 'ציון דרך - שנה', // Milestone - Year
    semesterMarker: 'ציון דרך - סמסטר', // Milestone - Semester
    course: 'קורס', // Course
    lecturer: 'מרצה', // Lecturer
    site: 'אתר (קמפוס)', // Site (Campus)
    room: 'חדר', // Room
    default: 'אחר' // Other
};

// Translates a given event type key into its Hebrew equivalent using the dictionary above.
// If a translation isn't found, it returns a default "Other" value.
const translateEventType = (type) => eventTypeTranslation[type] || eventTypeTranslation.default;

// This helper function takes an event object and formats its details into a user-friendly string.
// It builds a summary that can include time, lecturer, location, and notes,
// depending on the type of event.
const formatEventDetailsToString = (event) => {
    let details = [];
    try {
        // Handle time formatting. For all-day events, time is omitted.
        if (event.allDay) {
            // No time needed for all-day events
        } else if (event.start) {
            // Format start time.
            const startTime = format(parseISO(event.start), 'HH:mm');
            // Format end time, showing the date only if it's on a different day than the start.
            const endTime = event.end && !isSameDay(parseISO(event.start), parseISO(event.end))
                ? format(parseISO(event.end), 'HH:mm dd/MM') // Show date if the event spans across midnight.
                : (event.end ? format(parseISO(event.end), 'HH:mm') : '');

            // Construct the time string part.
            if (startTime && endTime && startTime !== endTime) {
                details.push(`🕒 ${startTime} - ${endTime}`);
            } else if (startTime) {
                details.push(`🕒 ${startTime}`);
            }
        }
    } catch (e) {
        // Log a warning if date parsing or formatting fails, to avoid crashing.
        console.warn("Could not format time for event:", event, e);
    }

    // Add specific details based on the event type.
    switch (event.type) {
        case 'courseMeeting':
            if (event.lecturerName) details.push(`👨‍🏫 ${event.lecturerName}`);
            if (event.roomName) details.push(`📍 ${event.roomName}${event.siteName ? ` (${event.siteName})` : ''}`);
            break;
        case 'task':
            // For tasks, show the associated course name or code.
            if (event.courseName) details.push(`📚 ${event.courseName}`);
            else if (event.courseCode) details.push(`📚 ${event.courseCode}`);
            break;
    }

    // Append any general notes associated with the event.
    if (event.notes) {
        details.push(`📝 ${event.notes}`);
    }

    // Return the combined details as a formatted string for list display.
    return details.length > 0 ? `\n   - ${details.join(' | ')}` : '';
};

// This is the main handler for function calls coming from the AI model.
// It identifies the requested function by its name (e.g., 'getCalendarEvents')
// and passes the arguments to the correct internal logic.
// It requires the 'currentUser' object to perform actions on behalf of the user.
// The function returns a promise that resolves with an object containing either 'content' or 'error'.
export const handleAIFunctionCall = async (toolCall, currentUser) => {
    const functionName = toolCall.name;
    const args = toolCall.args;

    // A user must be logged in for any function to execute.
    if (!currentUser) return { error: "User not logged in." };

    // Route the call to the appropriate function based on its name.
    switch (functionName) {
        // Case for fetching and formatting calendar events within a specified date range.
        case 'getCalendarEvents':
            try {
                // Fetch the raw event data for the user and date range.
                const result = await fetchEventsForAI(currentUser, args.startDate, args.endDate);
                if (result.error) return { error: result.error };

                if (result.events && result.events.length > 0) {
                    // Group events by date for a more structured and readable output.
                    const groupedByDate = result.events.reduce((acc, event) => {
                        try {
                            const start = parseISO(event.start);
                            const end = event.end ? parseISO(event.end) : start;

                            // For multi-day all-day events, list the event on each day it occurs.
                            if (event.allDay) {
                                const daysInInterval = eachDayOfInterval({ start, end });
                                daysInInterval.forEach(day => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    if (!acc[dateKey]) acc[dateKey] = [];
                                    // Avoid duplicating the event on the same day.
                                    if (!acc[dateKey].some(e => e.id === event.id)) {
                                        acc[dateKey].push(event);
                                    }
                                });
                            } else {
                                // For non-all-day events, group them only by their start date.
                                const dateKey = format(start, 'yyyy-MM-dd');
                                if (!acc[dateKey]) acc[dateKey] = [];
                                acc[dateKey].push(event);
                            }
                        } catch (e) {
                            // Log errors during date processing but don't halt execution.
                            console.error("Failed to process event interval:", event, e);
                        }
                        return acc;
                    }, {});

                    // Begin constructing the text response for the AI.
                    let responseText = `מצאתי ${result.events.length} אירועים עבורך בין ${args.startDate} ל-${args.endDate}:\n\n`;

                    // Iterate through the grouped dates, sort them, and format the output.
                    Object.keys(groupedByDate).sort().forEach(dateKey => {
                        // Format the date header in Hebrew.
                        const formattedDate = format(parseISO(dateKey), "EEEE, d 'ב'MMMM yyyy", { locale: he });
                        responseText += `**${formattedDate}**:\n`;

                        // Sort events within each day by start time and add them to the response.
                        groupedByDate[dateKey].sort((a, b) => a.start.localeCompare(b.start)).forEach(event => {
                            const eventTypeString = `[${translateEventType(event.type)}]`;
                            // Combine the type, title, and formatted details into a single line.
                            responseText += `- ${eventTypeString} ${event.title || 'ללא שם'}${formatEventDetailsToString(event)}\n`;
                        });

                        responseText += "\n"; // Add a newline for spacing between days.
                    });

                    return { content: responseText };
                } else {
                    // Inform the user if no events were found in the given range.
                    return { content: `לא מצאתי אירועים עבורך בין ${args.startDate} ל-${args.endDate}.` };
                }
            } catch (error) {
                // Catch any unexpected errors during the fetch process.
                return { error: `Error fetching events: ${error.message}` };
            }

        // Case for fetching the courses a student is enrolled in for a given semester.
        case 'getStudentCourses':
            try {
                // Fetch the student's courses for the specified semester.
                const result = await fetchStudentCoursesForSemester(currentUser, args.semesterCode);
                if (result.error) return { error: result.error };
                if (result.courses && result.courses.length > 0) {
                    // Format the list of courses into a human-readable string.
                    let responseText = `בסמסטר ${result.semesterCode || 'הנוכחי'}, את/ה רשום/ה ל-${result.count} קורסים:\n`;
                    result.courses.forEach(course => {
                        responseText += `- ${course.courseName} (קוד: ${course.courseCode})\n`;
                    });
                    return { content: responseText };
                } else {
                    // Handle the case where no courses are found for that semester.
                    return { content: `לא נמצאו קורסים המשויכים אלייך לסמסטר ${result.semesterCode || 'הנוכחי'}.` };
                }
            } catch (error) {
                return { error: `Error fetching courses: ${error.message}` };
            }

        // Case for fetching general information about courses, not tied to a specific student.
        case 'getCourseDefinitions':
            try {
                // Fetch all courses and lecturers in parallel for efficiency.
                const [allCoursesResult, allLecturers] = await Promise.all([
                    queryCourses({ semesterCode: args.semesterCode, courseName: args.courseName }),
                    fetchCollection('lecturers')
                ]);

                if (allCoursesResult.error) return { error: allCoursesResult.error };

                // Create a Map of lecturers for quick ID-to-name lookup.
                const lecturersMap = new Map((allLecturers || []).map(l => [l.id, l.name]));
                let finalCourses = allCoursesResult.courses;

                // If a course name is provided, perform a secondary filter on the results.
                if (args.courseName) {
                    finalCourses = finalCourses.filter(c =>
                        c.courseName.toLowerCase().includes(args.courseName.toLowerCase())
                    );
                }

                // Enrich each course object with the lecturer's name.
                const enrichedCourses = finalCourses.map(course => ({
                    ...course,
                    lecturerName: lecturersMap.get(course.lecturerId) || 'לא ידוע' // 'Unknown'
                }));

                // Format the enriched course data into a response.
                if (enrichedCourses.length > 0) {
                    let responseText = `מצאתי ${enrichedCourses.length} קורסים תואמים:\n\n`; // Found matching courses
                    enrichedCourses.forEach(course => {
                        responseText += `**${course.courseName} (קוד: ${course.courseCode})**\n`;
                        responseText += `  - מרצה: ${course.lecturerName}\n`; // Lecturer
                        responseText += `  - סמסטר: ${course.semesterCode}\n`; // Semester
                        if (course.notes) responseText += `  - הערות: ${course.notes}\n`; // Notes
                        responseText += '\n';
                    });
                    return { content: responseText };
                } else {
                    // Handle the case where no courses match the criteria.
                    return { content: `לא מצאתי הגדרות קורס עבור הקריטריונים שצוינו.` }; // No course definitions found
                }

            } catch (error) {
                return { error: `Error fetching course definitions: ${error.message}` };
            }

        // Case for fetching information about lecturers, with an option to filter by name.
        case 'getLecturerInfo':
            try {
                // Fetch the entire list of lecturers.
                const lecturers = await fetchCollection('lecturers');
                let result = lecturers;
                // If a name is provided, filter the list.
                if (args.name) {
                    result = lecturers.filter(l => l.name.toLowerCase().includes(args.name.toLowerCase()));
                }
                // Format the results into a response string.
                if (result.length > 0) {
                    let responseText = `מצאתי ${result.length} מרצים:\n`; // Found X lecturers
                    result.forEach(l => {
                        responseText += `- ${l.name} (ID: ${l.id}, Email: ${l.email || 'N/A'})\n`;
                    });
                    return { content: responseText };
                } else {
                    // Handle the case where no lecturers match the search term.
                    return { content: `לא מצאתי מרצים התואמים לחיפוש "${args.name}".` }; // No lecturers found matching the search
                }
            } catch (error) {
                return { error: `Error fetching lecturers: ${error.message}` };
            }

        // Case for fetching info about sites (campuses) and rooms.
        // It can either search for a specific room or list all sites and their rooms.
        case 'getSiteAndRoomInfo':
            try {
                // Fetch all site data, which includes nested room information.
                const sites = await fetchCollection('sites');
                let responseText = '';
                // If a specific room code is provided, search for that room.
                if (args.roomCode) {
                    let foundRoom = null, foundSite = null;
                    // Iterate through each site to find the room.
                    for (const site of sites) {
                        const room = (site.rooms || []).find(r => r.roomCode.toLowerCase() === args.roomCode.toLowerCase());
                        if (room) {
                            foundRoom = room;
                            foundSite = site;
                            break;
                        }
                    }
                    if (foundRoom) {
                        responseText = `חדר ${foundRoom.roomName} (קוד: ${foundRoom.roomCode}) נמצא באתר ${foundSite.siteName}.`; // Room X is in site Y
                        if (foundRoom.notes) responseText += ` הערות: ${foundRoom.notes}`; // Notes
                    } else {
                        responseText = `לא מצאתי חדר עם הקוד "${args.roomCode}".`; // Did not find a room with code X
                    }
                } else {
                    // If no room code is given, list all sites and their rooms.
                    responseText = 'רשימת האתרים והחדרים במערכת:\n\n'; // List of sites and rooms
                    sites.forEach(site => {
                        responseText += `**${site.siteName} (קוד: ${site.siteCode})**\n`;
                        (site.rooms || []).forEach(room => {
                            responseText += `  - חדר: ${room.roomName} (קוד: ${room.roomCode})\n`; // Room
                        });
                        responseText += '\n';
                    });
                }
                return { content: responseText };
            } catch (error) {
                return { error: `Error fetching sites and rooms: ${error.message}` };
            }

        // Default case to handle any unrecognized function names.
        default:
            return { error: `Function '${functionName}' is not recognized.` };
    }
};