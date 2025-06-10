// src/context/AgentContext.jsx

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { runAIAgent } from '../services/geminiService';
import { agentTools } from '../config/aiTools';

const AgentContext = createContext(null);
export const useAgent = () => useContext(AgentContext);

const getSystemInstruction = (user) => {
    const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'אורח';
    return `
הנחיית מערכת: אתה "יועץ לוח זמנים".
ההקשר הנוכחי:
- התאריך של היום הוא: ${today}.
- המשתמש המחובר כעת הוא: "${userName}". אל תבקש ממנו את זהותו.
כללי הזהב שלך:
1. ענה תמיד בעברית.
2. כדי לענות על שאלות, חובה להשתמש בכלי 'findRecords'.
3. הבן שפה טבעית כמו "מחר" או "15.6".
4. אשר לפני ביצוע פעולות כתיבה או מחיקה.
5. אם חסר לך מידע, שאל שאלות הבהרה.
`;
};

// פונקציית עזר להמרת מערך ההודעות הפנימי שלנו לפורמט של Gemini
const formatHistoryForAPI = (messages) => {
    // מתחילים מההודעה השנייה, כי הראשונה היא הודעת פתיחה של המערכת
    return messages.slice(1).map(msg => {
        switch (msg.role) {
            case 'user':
                return { role: 'user', parts: [{ text: msg.text }] };
            case 'agent':
                if (msg.functionCall) {
                    return { role: 'model', parts: [{ functionCall: msg.functionCall }] };
                }
                return { role: 'model', parts: [{ text: msg.text }] };
            case 'function':
                return {
                    role: 'function',
                    parts: [{
                        functionResponse: {
                            name: msg.name,
                            response: msg.response,
                        }
                    }]
                };
            default:
                return null;
        }
    }).filter(Boolean); // מסננים החוצה הודעות לא תקינות
};

export const AgentProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isAgentOpen && messages.length === 0) {
            setMessages([
                { role: 'agent', text: `שלום ${currentUser?.firstName || ''}, אני יועץ לוח הזמנים שלך. איך אפשר לעזור?` }
            ]);
        }
    }, [isAgentOpen, messages.length, currentUser]);

    const sendMessage = useCallback(async (messagePayload) => {
        if (isLoading) return;

        setIsLoading(true);
        
        // מוסיפים את ההודעה החדשה (מהמשתמש או מתוצאת פונקציה) להיסטוריה
        const updatedMessages = [...messages, messagePayload];
        setMessages(updatedMessages);
        
        try {
            // ממירים את כל ההיסטוריה לפורמט הנדרש
            const historyForAPI = formatHistoryForAPI(updatedMessages);
            
            // שולחים את ההיסטוריה המלאה לסרוויס
            const { response: agentResponse } = await runAIAgent(
                historyForAPI,
                agentTools,
                getSystemInstruction(currentUser)
            );
            
            // מוסיפים את תגובת הסוכן להיסטוריה
            setMessages(prev => [...prev, agentResponse]);

        } catch (error) {
            console.error("AgentContext Error:", error);
            setMessages(prev => [...prev, { role: 'agent', text: `אני מתנצל, אירעה שגיאה: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading, currentUser]);

    const value = useMemo(() => ({
        isAgentOpen, setIsAgentOpen, messages, isLoading, sendMessage,
    }), [isAgentOpen, messages, isLoading, sendMessage]);

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
};