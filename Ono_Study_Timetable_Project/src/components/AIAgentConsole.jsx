import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // ייבוא הפונקציה ליצירת Portal
import { Box, Paper, Typography, IconButton, TextField, Button, CircularProgress, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

import { useAuth } from '../context/AuthContext';
import { sendMessageToAI } from '../services/geminiService';
import { handleAIFunctionCall } from './agent/AIFunctionHandler';

// רכיב פנימי להצגת רשימת ההודעות
const MessageList = ({ messages }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <Stack spacing={2}>
            {messages.map((msg, index) => (
                <Paper
                    key={index}
                    elevation={1}
                    sx={{
                        p: 1.5,
                        maxWidth: '85%',
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.sender === 'user' ? 'primary.light' : 'grey.200',
                        color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    }}
                >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        {msg.text}
                    </Typography>
                </Paper>
            ))}
            <div ref={endOfMessagesRef} />
        </Stack>
    );
};


export default function AIAgentConsole({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setMessages([{ sender: 'ai', text: `שלום ${currentUser.firstName}! שמי אוני, איך אני יכול לעזור?` }]);
        } else {
            setMessages([]);
        }
    }, [currentUser, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault(); 
        if (!input.trim() || isLoading) return;

        const userMessageText = input;
        const newMessages = [...messages, { sender: 'user', text: userMessageText }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        console.group("--- AI Chat Turn ---");
        console.log("User Input:", userMessageText);

        try {
            const aiResponseText = await sendMessageToAI(newMessages, (toolCall) => handleAIFunctionCall(toolCall, currentUser));
            
            console.log("AI Final Response:", aiResponseText);
            
            const aiMessage = { sender: 'ai', text: aiResponseText };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error in chat turn:", error);
            const errorMessage = { sender: 'ai', text: "מצטער, נתקלתי בתקלה כללית." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            console.groupEnd();
        }
    };

    if (!isOpen) {
        return null; // אם החלון סגור, לא מרנדרים כלום
    }

    // ה-JSX של חלון הצ'אט שאנחנו רוצים "לשגר"
    const consoleUI = (
        <Paper 
            elevation={8} 
            sx={{ 
                position: 'fixed', 
                bottom: {xs: '80px', sm:'90px'}, 
                right: {xs: '5vw', sm:'24px'}, 
                width: { xs: '90vw', sm: '380px' }, 
                height: '500px', 
                maxHeight: '70vh', 
                zIndex: 1400, // z-index גבוה כדי שיהיה מעל הכל
                borderRadius: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden', 
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out', 
                transform: 'translateY(0)', 
                opacity: 1 
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '8px 16px', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6" component="h2">סייען AI</Typography>
                <IconButton onClick={onClose} color="inherit"><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
                <MessageList messages={messages} />
                {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            </Box>

            <Box 
                component="form" 
                onSubmit={handleSendMessage} 
                sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}
            >
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    size="small" 
                    placeholder={!currentUser ? "יש להתחבר למערכת..." : "שאל את אוני..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || !currentUser}
                    autoFocus
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={isLoading || !input.trim() || !currentUser}
                    aria-label="send message"
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </Button>
            </Box>
        </Paper>
    );
    return createPortal(consoleUI, document.body);
}