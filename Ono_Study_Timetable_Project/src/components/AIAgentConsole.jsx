import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Paper, Typography, IconButton, TextField, Button, CircularProgress, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';

import { useAuth } from '../context/AuthContext';
// ✨ FIX: Import only the necessary functions
import { sendMessageToAI } from '../services/geminiService';
import { handleAIFunctionCall } from './agent/AIFunctionHandler';

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
                    <Box sx={{
                        '& p': { margin: 0 },
                        '& h2, & h3, & h4': { marginTop: '1em', marginBottom: '0.5em' },
                        '& ul, & ol': { paddingLeft: '20px' },
                    }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </Box>
                </Paper>
            ))}
            <div ref={endOfMessagesRef} />
        </Stack>
    );
};

export default function AIAgentConsole({ isOpen, onClose }) {
    const { currentUser } = useAuth();
    // We no longer need the 'chat' state object
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialize with a welcome message when opened for a logged-in user
        if (isOpen && currentUser) {
            setMessages([{ sender: 'ai', text: `שלום ${currentUser.firstName}! שמי אוני, איך אני יכול לעזור?` }]);
        } else {
            // Clear messages if closed or no user
            setMessages([]);
        }
    }, [currentUser, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault(); 
        if (!input.trim() || isLoading) return;

        const userMessageText = input;
        // Add the user's message to the UI immediately
        setMessages(prev => [...prev, { sender: 'user', text: userMessageText }]);
        setInput('');
        setIsLoading(true);

        console.group("--- AI Chat Turn ---");
        console.log("User Input:", userMessageText);
        
        try {
            // Call the service with ONLY the last user message text.
            // The service itself will build the necessary context.
            const aiResponseText = await sendMessageToAI(userMessageText, (toolCall) => handleAIFunctionCall(toolCall, currentUser));
            
            console.log("Final response to be displayed:", aiResponseText);
            
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
        return null;
    }

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
                zIndex: 1400,
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