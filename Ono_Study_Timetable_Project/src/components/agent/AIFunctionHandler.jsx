// src/components/agent/AIFunctionHandler.jsx

import { useEffect, useCallback } from 'react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { useAppData } from '../../context/AppDataContext';
import { formMappings } from '../../utils/formMappings';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { parseDate } from 'chrono-node';
import { isSameDay, parseISO } from 'date-fns';

// This placeholder function is CRITICAL. You need to create its real implementation.
// It should take a course object and generate all its meeting instances for the semester.
const generateMeetingsFromCourse = (course, allYears) => {
    // A simplified placeholder. Your real implementation needs to be here.
    if (!course || !course.hours || !course.semesterCode) return [];
    
    // Find the semester details to get start and end dates
    let semester;
    for (const year of allYears) {
        const foundSemester = year.semesters.find(s => s.semesterCode === course.semesterCode);
        if (foundSemester) {
            semester = foundSemester;
            break;
        }
    }
    if (!semester) return [];
    
    // Your real logic to iterate from semester.startDate to semester.endDate and create meetings
    // based on course.hours would go here.
    // For this example, we'll return an empty array to avoid crashing.
    // console.warn("`generateMeetingsFromCourse` is a placeholder. You need to implement the real logic.");
    return [];
};


export default function AIFunctionHandler() {
    const { messages, sendMessage } = useAgent();
    const { currentUser } = useAuth();
    const { refreshEvents } = useEvents();
    const appData = useAppData(); // Assuming this context provides all raw data

    const executeFunctionCall = useCallback(async (functionCall) => {
        const { name: functionName, args: functionArgs } = functionCall;
        console.log(`[AIFunctionHandler] Executing: ${functionName}`, functionArgs);
        
        let functionResultPayload;

        try {
            switch (functionName) {
                case 'findRecords': {
                    const { recordType, filters } = functionArgs;
                    const { searchText, dateQuery } = filters || {};
                    
                    let sourceData = [];

                    // --- REWRITTEN LOGIC TO GET THE CORRECT DATA SOURCE ---
                    switch (recordType) {
                        case 'courseMeeting': {
                            const userCourseCodes = currentUser?.courseCodes || [];
                            const userCourses = (appData.courses || []).filter(c => userCourseCodes.includes(c.courseCode));
                            sourceData = userCourses.flatMap(course => generateMeetingsFromCourse(course, appData.years));
                            break;
                        }
                        case 'studentEvent': {
                            // Use USERNAME for filtering, not UID
                            sourceData = (appData.studentEvents || []).filter(e => e.studentId === currentUser?.username);
                            break;
                        }
                        case 'course': {
                            const userCourseCodes = currentUser?.courseCodes || [];
                            sourceData = (appData.courses || []).filter(c => userCourseCodes.includes(c.courseCode));
                            break;
                        }
                        default: {
                            const collectionName = formMappings[recordType]?.collectionName;
                            if (!collectionName) throw new Error(`Data source for "${recordType}" not found.`);
                            sourceData = appData[collectionName] || [];
                            break;
                        }
                    }

                    // --- Apply additional filters (date, text) ---
                    let filteredResults = sourceData;

                    if (dateQuery) {
                        const parsedDate = parseDate(dateQuery, new Date(), { forwardDate: true });
                        if (parsedDate) {
                            filteredResults = filteredResults.filter(item => {
                                const itemDate = new Date(item.date || item.startDate);
                                return isSameDay(itemDate, parsedDate);
                            });
                        }
                    }
                    
                    if (searchText) {
                        filteredResults = filteredResults.filter(item =>
                            (item.name || item.courseName || item.eventName || '').toLowerCase().includes(searchText.toLowerCase())
                        );
                    }
                    
                    functionResultPayload = { success: true, data: filteredResults, count: filteredResults.length };
                    break;
                }
                
                case 'saveOrUpdateRecord': {
                    const { recordType, id, data } = functionArgs;
                    const mode = id ? 'edit' : 'add';
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);

                    let dataToSave = data;
                    if (recordType === 'studentEvent' && mode === 'add') {
                        if (!currentUser?.username) throw new Error("User not logged in.");
                        dataToSave.studentId = currentUser.username;
                    }
                    
                    const result = await handleSaveOrUpdateRecord(collectionName, { ...dataToSave, id }, mode, { recordType, editingId: id });
                    if (!result.success) throw new Error(result.message);
                    
                    refreshEvents();
                    functionResultPayload = { success: true, message: "הפעולה בוצעה בהצלחה." };
                    break;
                }

                case 'deleteRecord': {
                    const { recordType, recordId, parentId } = functionArgs;
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);
                    if (!recordId) throw new Error("recordId is required for deletion.");

                    const result = await handleDeleteEntity(collectionName, recordId, { recordType, parentDocId: parentId });
                    if (!result.success) throw new Error(result.message);
                    
                    refreshEvents();
                    functionResultPayload = { success: true, message: "הפריט נמחק." };
                    break;
                }

                default:
                    throw new Error(`The requested function "${functionName}" is not known.`);
            }
        } catch (error) {
            console.error(`[AIFunctionHandler] Error:`, error);
            functionResultPayload = { success: false, error: error.message };
        }

        sendMessage([{ functionResponse: { name: functionName, response: functionResultPayload } }]);
    }, [appData, currentUser, refreshEvents, sendMessage]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'agent' && lastMessage.functionCall && !lastMessage.isHandled) {
            lastMessage.isHandled = true;
            executeFunctionCall(lastMessage.functionCall);
        }
    }, [messages, executeFunctionCall]);

    return null;
}