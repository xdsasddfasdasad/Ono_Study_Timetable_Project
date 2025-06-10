// src/context/AgentContext.jsx

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext'; // To get the current user's context
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

// This function dynamically creates the system instruction with up-to-date context.
const getSystemInstruction = (user) => {
    const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const userName = user ? `${user.firstName} ${user.lastName}` : 'אורח';
    const userId = user ? user.uid || user.username : 'N/A'; // Use uid or username as the identifier

    return `
הנחיית מערכת: אתה "יועץ לוח זמנים", סוכן AI מומחה וידידותי למערכת Timetable Pro.
תפקידך להבין בקשות של משתמשים בעברית ולהשתמש בכלים שסופקו לך כדי לבצע אותן.

ההקשר הנוכחי:
- התאריך של היום הוא: ${today}.
- המשתמש המחובר כעת הוא: "${userName}" (עם המזהה: ${userId}).
- השתמש במזהה זה באופן אוטומטי עבור כל פעולה אישית שהמשתמש מבקש. אל תבקש ממנו את המזהה שלו.

כללי הזהב שלך:
1.  ענה תמיד בעברית רהוטה ומנומסת.
2.  אל תענה "אני לא יכול" או "אין לי גישה". תפקידך הוא להשתמש בכלי 'findRecords' כדי למצוא את המידע שהמשתמש צריך.
3.  הבן שפה טבעית. אם המשתמש כותב "השבוע" או "15.6", השתמש בטקסט הזה בפרמטר 'dateQuery'. אם הוא כותב "הקורס של ריאקט", השתמש בטקסט הזה בפרמטר 'searchText'.
4.  אשר לפני ביצוע פעולות כתיבה ('saveOrUpdateRecord') או מחיקה ('deleteRecord'). הצג למשתמש סיכום ברור של הפעולה ובקש את אישורו.
5.  אם חסר לך מידע, שאל שאלות הבהרה נקודתיות.
`;
};

export const AgentProvider = ({ children }) => {
    const { currentUser } = useAuth(); // Get user from AuthContext
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // This effect sets the initial greeting message when the modal opens for the first time.
    useEffect(() => {
        if (isAgentOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'agent',
                    text: `שלום ${currentUser?.firstName || ''}, אני יועץ לוח הזמנים האישי שלך. איך אפשר לעזור היום?`,
                    functionCall: null,
                }
            ]);
        }
    }, [isAgentOpen, messages.length, currentUser]);

    /**
     * Handles sending new content to the AI and updating the chat state.
     * @param {string | object[]} messageContent - The user's text or a functionResponse object array.
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
            // Prepare history for the API.
            // Exclude our hardcoded greeting and format roles and parts correctly.
            const history = currentMessages.slice(1).map(msg => {
                if (msg.role === 'agent' && msg.functionCall) {
                    return { role: 'model', parts: [{ functionCall: msg.functionCall }] };
                }
                // Handle the function response from AIFunctionHandler
                if (msg.role === 'user' && Array.isArray(msg.text)) { 
                    return { role: 'user', parts: msg.text };
                }
                return { role: msg.role === 'agent' ? 'model' : 'user', parts: [{ text: msg.text }] };
            });
            
            const messageToSend = typeof messageContent === 'string' ? messageContent : messageContent;

            // Generate the dynamic system instruction with the most up-to-date context.
            const systemInstruction = getSystemInstruction(currentUser);

            // Call the stateless service function.
            const { response: agentResponse } = await runAIAgent(
                history,
                messageToSend,
                agentTools,
                systemInstruction
            );
            
            // Add the AI's new response to our state.
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

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    );
};