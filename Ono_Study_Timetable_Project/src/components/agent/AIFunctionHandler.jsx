// src/components/agent/AIFunctionHandler.jsx
// --- FINAL VERSION WITH CORRECT USER CONTEXT LOGIC ---

import { useEffect, useCallback } from 'react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { useAppData } from '../../context/AppDataContext';
import { formMappings } from '../../utils/formMappings';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { parseDate } from 'chrono-node';
import { isSameDay, parseISO } from 'date-fns';

export default function AIFunctionHandler() {
    const { messages, sendMessage } = useAgent();
    const { currentUser } = useAuth(); // The source of truth for user context
    const { refreshEvents } = useEvents();
    const appData = useAppData(); // The central source of all raw data

    const executeFunctionCall = useCallback(async (functionCall) => {
        const { name: functionName, args: functionArgs } = functionCall;
        console.log(`[AIFunctionHandler] Executing: ${functionName}`, functionArgs);
        
        let functionResultPayload;

        try {
            switch (functionName) {
                case 'findRecords': {
                    const { recordType, searchText, dateQuery } = functionArgs;

                    let relevantData = [];

                    // --- THIS IS THE CORE LOGIC FIX ---
                    // Instead of searching all data, we first determine what data is relevant to the CURRENT USER.
                    
                    switch (recordType) {
                        case 'courseMeeting': {
                            // 1. Find the course codes the user is registered to.
                            const userCourseCodes = currentUser?.courseCodes || [];
                            // 2. Filter the main course list to get the user's courses.
                            const userCourses = appData.courses.filter(c => userCourseCodes.includes(c.courseCode));
                            // 3. Find all meetings that belong to those courses.
                            relevantData = appData.meetings.filter(m => userCourseCodes.includes(m.courseCode));
                            break;
                        }
                        case 'studentEvent': {
                            // Filter events where the studentId matches the logged-in user's USERNAME.
                            relevantData = appData.studentEvents.filter(e => e.studentId === currentUser?.username);
                            break;
                        }
                        case 'course': {
                            // For finding courses, we only show the courses the user is enrolled in.
                            const userCourseCodes = currentUser?.courseCodes || [];
                            relevantData = appData.courses.filter(c => userCourseCodes.includes(c.courseCode));
                            break;
                        }
                        default: {
                            // For general data like holidays, lecturers, etc., use the full list.
                            const collectionName = formMappings[recordType]?.collectionName;
                            if (!collectionName) throw new Error(`Data source for "${recordType}" not found.`);
                            relevantData = appData[collectionName] || [];
                            break;
                        }
                    }

                    // --- Now, apply additional filters (date, text) ON THE RELEVANT DATA ---
                    let filteredResults = relevantData;

                    if (dateQuery) {
                        const parsedDate = parseDate(dateQuery, new Date(), { forwardDate: true });
                        if (parsedDate) {
                            filteredResults = filteredResults.filter(item => {
                                const itemDate = item.date ? new Date(item.date) : (item.startDate ? new Date(item.startDate) : null);
                                if (!itemDate) return false;
                                return isSameDay(itemDate, parsedDate);
                            });
                        }
                    }
                    
                    if (searchText) {
                        filteredResults = filteredResults.filter(item =>
                            (item.name || item.courseName || item.eventName || '').toLowerCase().includes(searchText.toLowerCase())
                        );
                    }
                    
                    // Format results for the AI
                    const finalData = filteredResults.map(item => ({
                        id: item.id || item.eventCode || item.courseCode,
                        title: item.title || item.eventName || item.courseName,
                        start: item.start || item.date || item.startDate,
                        end: item.end || item.date || item.endDate,
                        type: recordType,
                    }));

                    functionResultPayload = { success: true, data: finalData, count: finalData.length };
                    break;
                }
                
                // Write/Delete operations need to be user-aware as well
                case 'saveOrUpdateRecord': {
                    const { recordType, id, data } = functionArgs;
                    let dataToSave = data;
                    if (recordType === 'studentEvent' && !id) {
                        if (!currentUser?.username) throw new Error("A user must be logged in to create a personal event.");
                        dataToSave.studentId = currentUser.username;
                    }
                    
                    const mode = id ? 'edit' : 'add';
                    const collectionName = formMappings[recordType]?.collectionName;
                    const result = await handleSaveOrUpdateRecord(collectionName, { ...dataToSave, id }, mode, { recordType, editingId: id });
                    if (!result.success) throw new Error(result.message);
                    
                    // We need a way to refresh appData here as well. For now, just refresh calendar.
                    refreshEvents();
                    functionResultPayload = { success: true, message: "הפעולה בוצעה בהצלחה." };
                    break;
                }

                default:
                    throw new Error(`The function "${functionName}" is not known.`);
            }
        } catch (error) {
            console.error(`[AIFunctionHandler] Error:`, error);
            functionResultPayload = { success: false, error: error.message };
        }

        sendMessage([
            {
                functionResponse: {
                    name: functionName,
                    response: functionResultPayload,
                },
            },
        ]);

    }, [appData, currentUser, refreshEvents, sendMessage]);

    // This useEffect listens for new messages and triggers the execution
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'agent' && lastMessage.functionCall && !lastMessage.isHandled) {
            lastMessage.isHandled = true;
            executeFunctionCall(lastMessage.functionCall);
        }
    }, [messages, executeFunctionCall]);

    return null;
}