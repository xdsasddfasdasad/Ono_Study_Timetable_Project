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

    const sendMessage = useCallback(async (messageContent, isFunctionResponse = false) => {
        if (isLoading) return;
        if (typeof messageContent === 'string' && !messageContent.trim()) return;

        setIsLoading(true);
        let currentMessages = messages;

        // Add the new part to the conversation history
        if (isFunctionResponse) {
            // This is the result from our AIFunctionHandler
            const functionMessage = { role: 'function', response: messageContent };
            currentMessages = [...messages, functionMessage];
        } else {
            // This is a new message from the user
            const userMessage = { role: 'user', text: messageContent };
            currentMessages = [...messages, userMessage];
        }
        setMessages(currentMessages);
        
        try {
            const history = currentMessages.slice(1).map(msg => {
                if (msg.role === 'agent' && msg.functionCall) {
                    return { role: 'model', parts: [{ functionCall: msg.functionCall }] };
                }
                if (msg.role === 'function') {
                    // This is the crucial part that fixes the error
                    return { role: 'function', parts: [{ functionResponse: msg.response }] };
                }
                return { role: msg.role === 'agent' ? 'model' : 'user', parts: [{ text: msg.text }] };
            });
            
            // The service expects only the *newest* part of the conversation
            const latestMessage = currentMessages[currentMessages.length - 1];
            let messageToSend = [];
            if (latestMessage.role === 'user') {
                messageToSend = latestMessage.text;
            } else if (latestMessage.role === 'function') {
                messageToSend.push({ functionResponse: latestMessage.response });
            }

            const { response: agentResponse } = await runAIAgent(
                history,
                messageToSend,
                agentTools,
                getSystemInstruction(currentUser)
            );
            
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