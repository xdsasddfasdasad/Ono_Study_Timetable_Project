import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, Paper, Typography, IconButton, TextField, Button, CircularProgress, Stack, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventIcon from '@mui/icons-material/Event';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CelebrationIcon from '@mui/icons-material/Celebration';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import FlagIcon from '@mui/icons-material/Flag';
import PersonIcon from '@mui/icons-material/Person';

import { useAuth } from '../context/AuthContext';
import { sendMessageToAI } from '../services/geminiService';
import { handleAIFunctionCall } from './agent/AIFunctionHandler';

const ICONS = {
    courseMeeting: <SchoolIcon fontSize="inherit" sx={{mr: 0.5}} />,
    task: <TaskAltIcon fontSize="inherit" sx={{mr: 0.5}} />,
    event: <EventIcon fontSize="inherit" sx={{mr: 0.5}} />,
    studentEvent: <PersonIcon fontSize="inherit" sx={{mr: 0.5}} />,
    holiday: <CelebrationIcon fontSize="inherit" sx={{mr: 0.5}} />,
    vacation: <BeachAccessIcon fontSize="inherit" sx={{mr: 0.5}} />,
    yearMarker: <FlagIcon fontSize="inherit" sx={{mr: 0.5}} />,
    semesterMarker: <FlagIcon fontSize="inherit" sx={{mr: 0.5}} />,
    default: <HelpOutlineIcon fontSize="inherit" sx={{mr: 0.5}} />,
};

const StructuredResponse = ({ data }) => {
    if (!data || !data.response) {
        return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{typeof data === 'string' ? data : "שגיאה בעיבוד התשובה."}</Typography>;
    }
    
    const { intro_text, items } = data.response;

    return (
        <Stack spacing={2} sx={{p: 1, direction: 'rtl'}}> 
            {intro_text && <Typography variant="body1" sx={{fontWeight: 'bold'}}>{intro_text}</Typography>}
            {(items || []).map((item, index) => (
                <Box key={index} sx={{ borderRight: 3, borderLeft: 'none', borderColor: 'primary.light', pr: 1.5, '&:not(:last-child)': { mb: 1.5 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{item.primary_text}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{item.secondary_text}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                            icon={ICONS[item.type] || ICONS.default}
                            label={item.type}
                            size="small"
                            variant="outlined"
                        />
                        {(item.details || []).map((detail, dIndex) => (
                            <Chip key={dIndex} label={detail} size="small" variant="filled" sx={{bgcolor: 'grey.300'}} />
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
};

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
                    elevation={msg.sender === 'user' ? 0 : 1}
                    sx={{
                        p: 1.5,
                        maxWidth: '95%',
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                        color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    }}
                >
                    {typeof msg.data === 'object' && msg.data !== null ? (
                        <StructuredResponse data={msg.data} />
                    ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</Typography>
                    )}
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
            setMessages([{ sender: 'ai', text: `שלום ${currentUser.firstName}! שמי אוני, איך אני יכול לעזור?`, data: null }]);
        } else {
            setMessages([]);
        }
    }, [currentUser, isOpen]);

     const handleSendMessage = async (e) => {
        e.preventDefault(); 
        if (!input.trim() || isLoading) return;

        const userMessageText = input;
        setMessages(prev => [...prev, { sender: 'user', text: userMessageText, data: null }]);
        setInput('');
        setIsLoading(true);

        console.group("--- AI Chat Turn ---");
        try {
            const aiResponseText = await sendMessageToAI(userMessageText, (toolCall) => handleAIFunctionCall(toolCall, currentUser));
            
            let aiMessage;
            
            // ✨ THE FINAL FIX FOR PARSING LOGIC ✨
            // This logic cleans the response and handles both JSON and plain text correctly.
            let cleanedText = aiResponseText.trim();
            if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
            }

            try {
                // We only try to parse if it plausibly IS a JSON object.
                if (cleanedText.startsWith("{") && cleanedText.endsWith("}")) {
                    const parsedData = JSON.parse(cleanedText);
                    aiMessage = { 
                        sender: 'ai', 
                        text: parsedData.response?.intro_text || "הנה המידע שביקשת:", 
                        data: parsedData 
                    };
                } else {
                    // If it's not a JSON-like string, it's plain text.
                    aiMessage = { sender: 'ai', text: cleanedText, data: null };
                }
            } catch (error) {
                // This will only catch actual JSON parsing errors on strings that looked like JSON.
                console.error("JSON parsing failed despite cleaning. Treating as plain text.", error);
                aiMessage = { sender: 'ai', text: cleanedText, data: null };
            }
            
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error in chat turn:", error);
            const errorMessage = { sender: 'ai', text: "מצטער, נתקלתי בתקלה כללית.", data: null };
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
                position: 'fixed', bottom: {xs: '80px', sm:'90px'}, right: {xs: '5vw', sm:'24px'}, 
                width: { xs: '90vw', sm: '380px' }, height: '500px', maxHeight: '70vh', zIndex: 1400,
                borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out', 
                transform: 'translateY(0)', opacity: 1 
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '8px 16px', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6" component="h2">סייען AI</Typography>
                <IconButton onClick={onClose} color="inherit"><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
                <MessageList messages={messages} />
                {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            </Box>

            <Box 
                component="form" 
                onSubmit={handleSendMessage} 
                sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}
            >
                <TextField 
                    fullWidth variant="outlined" size="small" 
                    placeholder={!currentUser ? "יש להתחבר למערכת..." : "שאל את אוני..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || !currentUser}
                    autoFocus
                />
                <Button 
                    type="submit" variant="contained" 
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