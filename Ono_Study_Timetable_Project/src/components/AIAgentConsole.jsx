// src/components/AIAgentConsole.jsx

import React, { useState, useEffect, useRef } from 'react';
// `createPortal` is a React feature used to render a component's children into a different DOM node.
// This is perfect for modals and pop-ups, allowing them to escape their parent's styling constraints.
import { createPortal } from 'react-dom';
// Imports Material-UI components for building the chat interface.
import { Box, Paper, Typography, IconButton, TextField, Button, CircularProgress, Stack, Chip } from '@mui/material';
// Imports all the necessary icons.
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
// Imports the authentication context to get the current user.
import { useAuth } from '../context/AuthContext';
// Imports the services for communicating with the AI and handling its function calls.
import { sendMessageToAI } from '../services/geminiService';
import { handleAIFunctionCall } from './agent/AIFunctionHandler';

// A mapping of event types to their corresponding icons for rich, visual responses.
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

// A dedicated component for rendering a structured, JSON-based response from the AI.
const StructuredResponse = ({ data }) => {
    // A guard clause to handle malformed or non-structured data gracefully.
    if (!data || !data.response) {
        // Hebrew: "Error processing the response."
        return <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{typeof data === 'string' ? data : "שגיאה בעיבוד התשובה."}</Typography>;
    }
    
    const { intro_text, items } = data.response;

    return (
        <Stack spacing={2} sx={{p: 1}}> 
            {intro_text && <Typography variant="body1" sx={{fontWeight: 'bold'}}>{intro_text}</Typography>}
            {(items || []).map((item, index) => (
                <Box key={index} sx={{ borderLeft: 3, borderColor: 'primary.light', pl: 1.5, '&:not(:last-child)': { mb: 1.5 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{item.primary_text}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{item.secondary_text}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip icon={ICONS[item.type] || ICONS.default} label={item.type} size="small" variant="outlined" />
                        {(item.details || []).map((detail, dIndex) => (
                            <Chip key={dIndex} label={detail} size="small" variant="filled" sx={{bgcolor: 'grey.300'}} />
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>
    );
};

// A component that renders the list of chat messages.
const MessageList = ({ messages }) => {
    const endOfMessagesRef = useRef(null);

    // This effect ensures that the view automatically scrolls to the bottom
    // every time a new message is added to the list.
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
                        // Dynamically align the message bubble to the left or right.
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        // Dynamically style the bubble based on the sender.
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                        color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    }}
                >
                    {/* If the message data is a structured object, render the StructuredResponse component.
                        Otherwise, render it as plain text. */}
                    {typeof msg.data === 'object' && msg.data !== null ? (
                        <StructuredResponse data={msg.data} />
                    ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.text}</Typography>
                    )}
                </Paper>
            ))}
            {/* This empty div is the target for our auto-scrolling ref. */}
            <div ref={endOfMessagesRef} />
        </Stack>
    );
};

// The main AI Agent Console component.
export default function AIAgentConsole({ isOpen, onClose }) {
    // === STATE MANAGEMENT ===
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]); // The list of all chat messages.
    const [input, setInput] = useState(''); // The user's current text in the input field.
    const [isLoading, setIsLoading] = useState(false); // Controls the loading state of the AI response.

    // Effect to initialize the chat with a welcome message when opened.
    useEffect(() => {
        if (isOpen && currentUser) {
            // Hebrew: "Hello [Name]! My name is Uni, how can I help?"
            setMessages([{ sender: 'ai', text: `שלום ${currentUser.firstName}! שמי אוני, איך אני יכול לעזור?`, data: null }]);
        } else {
            setMessages([]);
        }
    }, [currentUser, isOpen]);

     // This is the core function that handles a full chat turn.
     const handleSendMessage = async (e) => {
        e.preventDefault(); 
        if (!input.trim() || isLoading) return;

        // --- 1. User sends a message ---
        const userMessageText = input;
        // Immediately add the user's message to the UI for a responsive feel.
        setMessages(prev => [...prev, { sender: 'user', text: userMessageText, data: null }]);
        setInput('');
        setIsLoading(true);

        try {
            // --- 2. Call the AI service ---
            // This service handles the back-and-forth with the Gemini API.
            // It takes a callback function (`handleAIFunctionCall`) that it will execute
            // if the AI decides to use a tool/function.
            const aiResponseText = await sendMessageToAI(userMessageText, (toolCall) => handleAIFunctionCall(toolCall, currentUser));
            
            let aiMessage;
            
            // --- 3. Robustly Parse the AI's Response ---
            // This logic cleans the raw response and correctly handles both structured JSON and plain text.
            let cleanedText = aiResponseText.trim();
            // Remove markdown code fences if they exist.
            if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
            }

            try {
                // Heuristically check if the string looks like a JSON object before trying to parse.
                if (cleanedText.startsWith("{") && cleanedText.endsWith("}")) {
                    const parsedData = JSON.parse(cleanedText);
                    // If parsing succeeds, create a structured message object.
                    aiMessage = { 
                        sender: 'ai', 
                        text: parsedData.response?.intro_text || "Here is the information you requested:", // Hebrew: "הנה המידע שביקשת:"
                        data: parsedData 
                    };
                } else {
                    // If it's not JSON-like, treat it as plain text.
                    aiMessage = { sender: 'ai', text: cleanedText, data: null };
                }
            } catch (error) {
                // This catch block handles cases where the string *looked* like JSON but was invalid.
                // We fall back to treating it as plain text to avoid crashing.
                console.error("JSON parsing failed despite cleaning. Treating as plain text.", error);
                aiMessage = { sender: 'ai', text: cleanedText, data: null };
            }
            
            // Add the final AI message to the UI.
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            // --- 4. Handle General Errors ---
            console.error("Error in chat turn:", error);
            // Hebrew: "Sorry, I encountered a general error."
            const errorMessage = { sender: 'ai', text: "מצטער, נתקלתי בתקלה כללית.", data: null };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // If the console isn't open, render nothing.
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
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '8px 16px', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h6" component="h2">AI Assistant</Typography> 
                <IconButton onClick={onClose} color="inherit"><CloseIcon /></IconButton>
            </Box>

            {/* Message Display Area */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
                <MessageList messages={messages} />
                {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            </Box>

            {/* Input Form */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField 
                    fullWidth variant="outlined" size="small" 
                    // Hebrew: "Please log in...", "Ask Uni..."
                    placeholder={!currentUser ? "יש להתחבר למערכת..." : "שאל את אוני..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading || !currentUser}
                    autoFocus
                />
                <Button type="submit" variant="contained" disabled={isLoading || !input.trim() || !currentUser} aria-label="send message">
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </Button>
            </Box>
        </Paper>
    );

    // Render the entire console UI into the document body using a portal.
    // This ensures it can overlay all other content without being clipped by parent containers.
    return createPortal(consoleUI, document.body);
}