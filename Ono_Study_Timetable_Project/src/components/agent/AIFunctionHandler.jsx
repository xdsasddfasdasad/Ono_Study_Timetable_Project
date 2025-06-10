// src/components/agent/AIFunctionHandler.jsx

import { useEffect, useCallback } from 'react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { formMappings } from '../../utils/formMappings';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { parseDate } from 'chrono-node';
import { isSameDay } from 'date-fns';

/**
 * A non-visual "controller" component. It listens for function call requests
 * from the AI agent and executes them using the application's existing data and handlers.
 */
export default function AIFunctionHandler() {
    const { messages, sendMessage } = useAgent();
    const { currentUser } = useAuth(); // The source of truth for user identity
    const { refreshEvents, allVisibleEvents } = useEvents(); // The source of truth for what the user sees

    const executeFunctionCall = useCallback(async (functionCall) => {
        const { name: functionName, args: functionArgs } = functionCall;
        console.log(`[AIFunctionHandler] Executing function: ${functionName}`, functionArgs);
        
        let functionResultPayload;

        try {
            switch (functionName) {
                // --- READ OPERATION ---
                case 'findRecords': {
                    const { recordType, filters } = functionArgs;
                    const { searchText, dateQuery } = filters || {};
                    
                    // The source of truth is the array already processed for the calendar.
                    // This guarantees the AI sees exactly what the user sees.
                    let sourceData = allVisibleEvents;

                    // 1. Filter by recordType if the user specified one.
                    if (recordType) {
                        sourceData = sourceData.filter(event => event.extendedProps?.type === recordType);
                    }

                    // 2. Filter by dateQuery using reliable libraries.
                    if (dateQuery) {
                        const today = new Date();
                        const parsedDate = parseDate(dateQuery, today, { forwardDate: true });
                        if (parsedDate) {
                            sourceData = sourceData.filter(event => {
                                // event.start from FullCalendar is already a Date object.
                                // We don't need to parse it again. We compare it directly.
                                return event.start && isSameDay(event.start, parsedDate);
                            });
                        }
                    }
                    
                    // 3. Filter by searchText in the event title.
                    if (searchText) {
                        sourceData = sourceData.filter(event =>
                            event.title.toLowerCase().includes(searchText.toLowerCase())
                        );
                    }
                    
                    // 4. Format the final results into a clean structure for the AI.
                    const formattedResults = sourceData.map(event => ({
                        id: event.id,
                        title: event.title,
                        start: event.start.toISOString(),
                        end: event.end ? event.end.toISOString() : event.start.toISOString(),
                        type: event.extendedProps?.type,
                    }));

                    console.log(`[AIFunctionHandler] Found ${formattedResults.length} results.`);
                    functionResultPayload = { success: true, data: formattedResults, count: formattedResults.length };
                    break;
                }
                
                // --- WRITE OPERATION ---
                case 'saveOrUpdateRecord': {
                    const { recordType, id, data } = functionArgs;
                    const mode = id ? 'edit' : 'add';
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);

                    let dataToSave = data;
                    // Automatically add the current user's ID for new personal events
                    if (recordType === 'studentEvent' && mode === 'add') {
                        if (!currentUser?.uid) throw new Error("A user must be logged in to create a personal event.");
                        dataToSave.studentId = currentUser.uid; // Use the reliable UID for backend operations
                    }

                    const result = await handleSaveOrUpdateRecord(collectionName, { ...dataToSave, id }, mode, { recordType, editingId: id });
                    if (!result.success) throw new Error(result.message || "Save operation failed.");
                    
                    refreshEvents(); // Refresh calendar to show the new/updated item
                    functionResultPayload = { success: true, message: "הפעולה בוצעה בהצלחה." };
                    break;
                }

                // --- DELETE OPERATION ---
                case 'deleteRecord': {
                    const { recordType, recordId, parentId } = functionArgs;
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);
                    if (!recordId) throw new Error("A recordId is required for deletion.");

                    const result = await handleDeleteEntity(collectionName, recordId, { recordType, parentDocId: parentId });
                    if (!result.success) throw new Error(result.message || "Delete operation failed.");
                    
                    refreshEvents(); // Refresh calendar to remove the item
                    functionResultPayload = { success: true, message: "הפריט נמחק בהצלחה." };
                    break;
                }

                default:
                    throw new Error(`The requested function "${functionName}" is not known.`);
            }
        } catch (error) {
            console.error(`[AIFunctionHandler] Error during execution:`, error);
            functionResultPayload = { success: false, error: error.message };
        }

        // Send the result of the function back to the AI for processing.
        // This is a CRITICAL step for multi-turn conversations.
        sendMessage([
            {
                functionResponse: {
                    name: functionName,
                    response: functionResultPayload,
                },
            },
        ]);

    }, [currentUser, allVisibleEvents, refreshEvents, sendMessage]);

    // This useEffect listens for new messages from the agent and triggers the execution if a function call is present.
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'agent' && lastMessage.functionCall && !lastMessage.isHandled) {
            // Mark as handled immediately to prevent re-execution on re-renders
            lastMessage.isHandled = true; 
            executeFunctionCall(lastMessage.functionCall);
        }
    }, [messages, executeFunctionCall]);

    // This component renders nothing to the DOM. Its job is purely logical.
    return null;
}