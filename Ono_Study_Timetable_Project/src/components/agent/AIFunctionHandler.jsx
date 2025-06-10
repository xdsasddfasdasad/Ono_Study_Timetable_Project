// src/components/agent/AIFunctionHandler.jsx

import { useEffect, useCallback } from 'react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { formMappings } from '../../utils/formMappings'; // נניח שיש לך קובץ כזה
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { fetchCollectionWithQuery, fetchCollection } from '../../firebase/firestoreService';
import { where } from 'firebase/firestore';
import { parseDate } from 'chrono-node';
import { startOfDay, endOfDay } from 'date-fns';

export default function AIFunctionHandler() {
    const { messages, sendMessage, isLoading } = useAgent();
    const { currentUser } = useAuth();
    const { refreshEvents } = useEvents();

    const executeFunctionCall = useCallback(async (functionCall) => {
        const { name: functionName, args: functionArgs } = functionCall;
        console.log(`[AIFunctionHandler] Executing: ${functionName}`, functionArgs);
        
        let functionResultPayload;

        try {
            switch (functionName) {
                case 'findRecords': {
                    const { recordType, searchText, dateQuery } = functionArgs;
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);

                    const queryConstraints = [];
                    
                    // טיפול בשאילתת תאריך
                    if (dateQuery) {
                        const parsedDate = parseDate(dateQuery, new Date(), { forwardDate: true });
                        if (parsedDate) {
                            queryConstraints.push(where("startDate", ">=", startOfDay(parsedDate)));
                            queryConstraints.push(where("startDate", "<=", endOfDay(parsedDate)));
                        }
                    }
                    
                    // טיפול בחיפוש טקסט (מוגבל ב-Firestore, נדרשת אסטרטגיה מתקדמת יותר כמו Algolia לחיפוש מלא)
                    // כרגע נשתמש בסינון בצד הלקוח אחרי קבלת התוצאות
                    let results;
                    if (queryConstraints.length > 0) {
                        results = await fetchCollectionWithQuery(collectionName, queryConstraints);
                    } else {
                        results = await fetchCollection(collectionName);
                    }
                    
                    if (searchText) {
                        const lowerCaseSearch = searchText.toLowerCase();
                        // נסנן לפי שדה השם הרלוונטי לכל סוג רשומה
                        results = results.filter(item => 
                           (item.eventName && item.eventName.toLowerCase().includes(lowerCaseSearch)) ||
                           (item.courseName && item.courseName.toLowerCase().includes(lowerCaseSearch)) ||
                           (item.holidayName && item.holidayName.toLowerCase().includes(lowerCaseSearch)) ||
                           (item.name && item.name.toLowerCase().includes(lowerCaseSearch))
                        );
                    }

                    functionResultPayload = { success: true, count: results.length, data: results.slice(0, 10) }; // החזרת 10 תוצאות ראשונות למניעת הצפה
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
                    
                    await refreshEvents();
                    functionResultPayload = { success: true, message: "הפעולה בוצעה בהצלחה.", recordId: result.id };
                    break;
                }
                case 'deleteRecord': {
                    const { recordType, recordId, parentId } = functionArgs;
                    const collectionName = formMappings[recordType]?.collectionName;
                    if (!collectionName) throw new Error(`Collection for '${recordType}' not found.`);
                    if (!recordId) throw new Error("A recordId is required for deletion.");

                    const result = await handleDeleteEntity(collectionName, recordId, { recordType, parentDocId: parentId });
                    if (!result.success) throw new Error(result.message);
                    
                    await refreshEvents();
                    functionResultPayload = { success: true, message: "הפריט נמחק." };
                    break;
                }
                default:
                    throw new Error(`Unknown function: "${functionName}"`);
            }
        } catch (error) {
            console.error(`[AIFunctionHandler] Error executing ${functionName}:`, error);
            functionResultPayload = { success: false, error: error.message };
        }

        // שולחים את התוצאה בחזרה ל-Context כדי שימשיך את השיחה עם ה-AI
        sendMessage({
            role: 'function',
            name: functionName,
            response: functionResultPayload
        });

    }, [currentUser, refreshEvents, sendMessage]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        // בודקים אם ההודעה האחרונה היא קריאה לפונקציה, ואם אנחנו לא כבר בתהליך טעינה
        if (lastMessage?.role === 'agent' && lastMessage.functionCall && !isLoading) {
            executeFunctionCall(lastMessage.functionCall);
        }
    }, [messages, isLoading, executeFunctionCall]);

    return null; // רכיב זה אינו מרנדר כלום
}