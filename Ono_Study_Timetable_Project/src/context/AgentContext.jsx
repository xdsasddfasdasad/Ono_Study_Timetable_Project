// src/context/AgentContext.jsx

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth to get the current user
import { runAIAgent } from '../services/geminiService';
import { agentTools } from '../config/aiTools';

const AgentContext = createContext(null);

export const useAgent = () => {
    const context = useContext(AgentContext);
    if (context === undefined) {
        throw new Error('useAgent must be used within an AgentProvider');
    }
    return context;
};

// The system instruction that guides the AI's behavior.
// We make it a function to dynamically inject the current date and user ID.
const getSystemInstruction = (userId, date) => `
הנחיית מערכת: אתה "יועץ לוח זמנים", סוכן AI מומחה.
תפקידך להבין בקשות של משתמשים בעברית ולהשתמש בכלים שסופקו לך כדי לבצע אותן.

ההקשר הנוכחי:
- התאריך של היום הוא: ${date}
- המזהה של המשתמש המחובר כעת הוא: ${userId || 'GUEST'}. השתמש במזהה זה לפעולות אישיות.

כללי הזהב שלך:
1.  ענה תמיד בעברית.
2.  אל תענה "אני לא יכול" או "אין לי גישה". השתמש בכלי 'findRecords' כדי למצוא מידע.
3.  אל תבקש מהמשתמש את המזהה שלו. הוא כבר סופק לך.
4.  הבן שפה טבעית כמו "מחר" או "15.6".
5.  אשר לפני ביצוע פעולות כתיבה או מחיקה.
6.  אם חסר לך מידע, שאל שאלות הבהרה.
`;

export const AgentProvider = ({ children }) => {
    const { currentUser } = useAuth(); // Get the logged-in user from the AuthContext
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // This effect sets the initial greeting message when the modal opens for the first time.
    useEffect(() => {
        if (isAgentOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'agent',
                    text: 'שלום! אני יועץ לוח הזמנים האישי שלך. איך אוכל לעזור היום?',
                    functionCall: null,
                }
            ]);
        }
    }, [isAgentOpen, messages.length]);

    /**
     * Handles sending new messages to the AI.
     * @param {string | object} messageContent - The user's text or a functionResponse object.
     */
    const sendMessage = useCallback(async (messageContent) => {
        if (isLoading) return;
        if (typeof messageContent === 'string' && !messageContent.trim()) return;

        setIsLoading(true);
        let currentMessages = messages;

        // Add user's new message to the state for immediate UI update.
        if (typeof messageContent === 'string') {
            const userMessage = { role: 'user', text: messageContent, functionCall: null };
            currentMessages = [...messages, userMessage];
            setMessages(currentMessages);
        }
        
        try {
            // Prepare history for the API, excluding our hardcoded greeting.
            const history = currentMessages.slice(1).map(msg => {
                if (msg.role === 'agent' && msg.functionCall) {
                    return { role: 'model', parts: [{ functionCall: msg.functionCall }] };
                }
                if (msg.role === 'user' && typeof msg.text === 'object') {
                    return { role: 'user', parts: [ msg.text ]};
                }
                return { role: msg.role === 'agent' ? 'model' : 'user', parts: [{ text: msg.text }] };
            });
            
            const messageToSend = typeof messageContent === 'string' ? messageContent : messageContent;

            // Generate the dynamic system instruction with the current date and user ID.
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const systemInstruction = getSystemInstruction(currentUser?.uid, today);

            // Call the stateless service function.
            const { response: agentResponse } = await runAIAgent(
                history,
                messageToSend,
                agentTools,
                systemInstruction
            );
            
            setMessages(prev => [...prev, agentResponse]);

        } catch (error) {
            console.error("AgentContext: Error during sendMessage:", error);
            setMessages(prev => [...prev, { role: 'agent', text: `אני מתנצל, אירעה שגיאה: ${error.message}`, functionCall: null }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading, currentUser]);

    const value = useMemo(() => ({
        isAgentOpen,
        setIsAgentOpen,
        messages,
        isLoading,
        sendMessage,
    }), [isAgentOpen, messages, isLoading, sendMessage]);

    // --- SYNTAX FIX IS HERE ---
    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
};