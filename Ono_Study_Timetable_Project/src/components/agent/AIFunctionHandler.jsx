// src/components/agent/AIFunctionHandler.jsx

import { useEffect, useCallback } from 'react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { formMappings } from '../../utils/formMappings';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { parseDate } from 'chrono-node';
import { isSameDay } from 'date-fns';

export default function AIFunctionHandler() {
    const { messages, sendMessage } = useAgent();
    const { currentUser } = useAuth();
    const { refreshEvents, allVisibleEvents } = useEvents();

    const executeFunctionCall = useCallback(async (functionCall) => {
        const { name: functionName, args: functionArgs } = functionCall;
        console.log(`[AIFunctionHandler] Executing: ${functionName}`, functionArgs);
        
        let functionResultPayload;

        try {
            switch (functionName) {
                case 'findRecords': {
                    const { recordType, filters } = functionArgs || {};
                    const { searchText, dateQuery } = filters || {};
                    let sourceData = allVisibleEvents;

                    if (recordType) {
                        sourceData = sourceData.filter(event => event.extendedProps?.type === recordType);
                    }
                    if (dateQuery) {
                        const parsedDate = parseDate(dateQuery, new Date(), { forwardDate: true });
                        if (parsedDate) {
                            sourceData = sourceData.filter(event => event.start && isSameDay(event.start, parsedDate));
                        }
                    }
                    if (searchText) {
                        sourceData = sourceData.filter(event => event.title.toLowerCase().includes(searchText.toLowerCase()));
                    }
                    
                    const formattedResults = sourceData.map(event => ({
                        id: event.id,
                        title: event.title,
                        start: event.start.toISOString(),
                        end: event.end ? event.end.toISOString() : event.start.toISOString(),
                        type: event.extendedProps?.type,
                    }));
                    functionResultPayload = { success: true, data: formattedResults };
                    break;
                }
                case 'saveOrUpdateRecord': {
                    const { recordType, id, data } = functionArgs;
                    const mode = id ? 'edit' : 'add';
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);

                    let dataToSave = data;
                    if (recordType === 'studentEvent' && mode === 'add') {
                        if (!currentUser?.uid) throw new Error("User not logged in.");
                        dataToSave.studentId = currentUser.uid;
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
                    if (!recordId) throw new Error("A recordId is required for deletion.");

                    const result = await handleDeleteEntity(collectionName, recordId, { recordType, parentDocId: parentId });
                    if (!result.success) throw new Error(result.message);
                    
                    refreshEvents();
                    functionResultPayload = { success: true, message: "הפריט נמחק." };
                    break;
                }
                default:
                    throw new Error(`Unknown function: "${functionName}"`);
            }
        } catch (error) {
            functionResultPayload = { success: false, error: error.message };
        }

        // --- THE CRITICAL FIX IS HERE ---
        // We now call sendMessage with the result and a flag indicating it's a function response.
        sendMessage({ name: functionName, response: functionResultPayload }, true);

    }, [currentUser, allVisibleEvents, refreshEvents, sendMessage]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'agent' && lastMessage.functionCall && !lastMessage.isHandled) {
            lastMessage.isHandled = true;
            executeFunctionCall(lastMessage.functionCall);
        }
    }, [messages, executeFunctionCall]);

    return null;
}