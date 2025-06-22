// src/components/agent/AgentModal.jsx (דוגמה)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { startChat, sendMessageToAI } from '../../services/geminiService';
import { handleAIFunctionCall } from './AIFunctionHandler';

const AgentModal = () => {
    const { currentUser } = useAuth();
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // התחל צ'אט חדש כשהקומפוננטה נטענת
        setChat(startChat());
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim() || !chat || !currentUser) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // הגדרת המטפל עם המשתמש הנוכחי
            const functionHandler = async (toolCall) => {
                const func = await handleAIFunctionCall(toolCall);
                return func(currentUser); // כאן אנחנו מזריקים את currentUser
            };
            
            const aiResponseText = await sendMessageToAI(chat, input, functionHandler);
            
            const aiMessage = { sender: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error communicating with AI:", error);
            const errorMessage = { sender: 'ai', text: "מצטער, נתקלתי בשגיאה." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="message-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            {isLoading && <div>חושב...</div>}
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>שלח</button>
        </div>
    );
};

export default AgentModal;