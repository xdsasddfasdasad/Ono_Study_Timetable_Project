// src/components/agent/AIFunctionHandler.jsx

import { fetchEventsForAI } from '../../utils/getAllVisibleEvents';
import { fetchStudentCoursesForSemester, queryCourses } from '../../utils/academicInfoService';
import { fetchCollection } from '../../firebase/firestoreService'; // ייבוא נחוץ

export const handleAIFunctionCall = async (toolCall, currentUser) => {
    const functionName = toolCall.name;
    const args = toolCall.args;

    console.log(`[AIFunctionHandler] Handling call to: '${functionName}' with args:`, args);

    if (!currentUser) {
        return { error: "User not logged in." };
    }

    switch (functionName) {
        case 'getCalendarEvents':
            try {
                // Return the raw, enriched result directly
                const result = await fetchEventsForAI(currentUser, args.startDate, args.endDate);
                return result; // Returns { events: [...] } or { error: '...' }
            } catch (error) {
                return { error: `Error fetching calendar events: ${error.message}` };
            }

        // ✨ FIX: Restoring the other cases
        case 'getStudentCourses':
            try {
                // Return the raw result directly
                const result = await fetchStudentCoursesForSemester(currentUser, args.semesterCode);
                return result;
            } catch (error) {
                return { error: `Error fetching student courses: ${error.message}` };
            }
        
        case 'getCourseDefinitions':
            try {
                const [allCoursesResult, allLecturers] = await Promise.all([
                    queryCourses({ semesterCode: args.semesterCode }),
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

                return { courses: enrichedCourses, count: enrichedCourses.length };

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
                return { lecturers: result, count: result.length };
            } catch (error) {
                return { error: `Error fetching lecturers: ${error.message}` };
            }

        case 'getSiteAndRoomInfo':
            try {
                const sites = await fetchCollection('sites');
                if (args.roomCode) {
                    let foundRoom = null;
                    let foundSite = null;
                    for (const site of sites) {
                        const room = (site.rooms || []).find(r => r.roomCode.toLowerCase() === args.roomCode.toLowerCase());
                        if (room) {
                            foundRoom = room;
                            foundSite = site;
                            break;
                        }
                    }
                    if (foundRoom) {
                        return { room: foundRoom, site: { siteName: foundSite.siteName, siteCode: foundSite.siteCode } };
                    } else {
                        return { error: `Room with code "${args.roomCode}" not found.` };
                    }
                } else {
                    return { sites };
                }
            } catch (error) {
                return { error: `Error fetching sites and rooms: ${error.message}` };
            }
            
        default:
            return { error: `Function '${functionName}' is not recognized.` };
    }
};