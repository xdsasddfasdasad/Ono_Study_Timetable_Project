// src/components/agent/AgentModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Box, TextField, 
    IconButton, List, ListItem, Typography, Paper, Avatar, CircularProgress 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useAgent } from '../../context/AgentContext'; // The custom hook to access global state

/**
 * A Dialog component that serves as the main chat interface for the AI Agent.
 * This component is a "dumb" view component; it reads its entire state 
 * and logic from the AgentContext.
 */
export default function AgentModal() {
    // 1. Consume the global context to get all necessary state and functions.
    const { isAgentOpen, setIsAgentOpen, messages, isLoading, sendMessage } = useAgent();
    
    // 2. Manage the local state for the text input field.
    const [input, setInput] = useState('');
    
    // 3. Use a ref to keep a reference to the last message element for auto-scrolling.
    const endOfMessagesRef = useRef(null);

    // Handler to send the message. It calls the global `sendMessage` function.
    const handleSend = () => {
        if (!input.trim()) return; // Don't send empty messages
        sendMessage(input);
        setInput(''); // Clear the input field after sending
    };

    // Handler to allow sending with the "Enter" key for better UX.
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevents adding a new line in the text field
            handleSend();
        }
    };
    
    // 4. Effect to automatically scroll to the bottom of the chat whenever new messages are added.
    useEffect(() => {
        // The optional chaining (?.) prevents errors if the ref is not yet attached.
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // This effect runs every time the `messages` array changes.

    return (
        <Dialog 
            open={isAgentOpen} 
            onClose={() => setIsAgentOpen(false)} 
            fullWidth 
            maxWidth="md"
            // Use PaperProps to style the dialog container itself, making it taller and flexible.
            PaperProps={{ sx: { height: '90vh', display: 'flex', flexDirection: 'column' } }}
        >
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, m: 0, p: 2 }}>
                AI Assistant
            </DialogTitle>
            
            {/* The main chat area, configured to grow and scroll */}
            <DialogContent sx={{ flex: '1 1 auto', p: 0, overflowY: 'auto' }}>
                <List sx={{ p: { xs: 1, sm: 2 } }}>
                    {messages.map((msg, index) => (
                        <ListItem 
                            key={index} 
                            sx={{ 
                                display: 'flex',
                                // Align user messages to the right, and agent messages to the left
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                mb: 1,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '80%' }}>
                                {msg.role === 'agent' && <Avatar sx={{ bgcolor: 'secondary.main' }}><SmartToyIcon /></Avatar>}
                                <Paper 
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                                        color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                        borderTopLeftRadius: msg.role === 'user' ? 8 : 2,
                                        borderTopRightRadius: msg.role === 'user' ? 2 : 8,
                                    }}
                                >
                                    {/* `whiteSpace: 'pre-wrap'` preserves line breaks and spacing from the AI's response */}
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {msg.text}
                                    </Typography>
                                </Paper>
                                {msg.role === 'user' && <Avatar><PersonIcon /></Avatar>}
                            </Box>
                        </ListItem>
                    ))}
                    {/* The "Agent is typing..." indicator */}
                    {isLoading && (
                        <ListItem sx={{ justifyContent: 'flex-start' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}><SmartToyIcon /></Avatar>
                                <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}>
                                    <CircularProgress size={20}/>
                                </Paper>
                             </Box>
                        </ListItem>
                    )}
                    {/* This empty div is the target for our auto-scroll */}
                    <div ref={endOfMessagesRef} />
                </List>
            </DialogContent>

            {/* The input area at the bottom */}
            <Box 
                component="form"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
            >
                <TextField 
                    fullWidth 
                    variant="outlined"
                    placeholder="שאל אותי משהו, למשל: 'מה יש לי מחר?' או 'קבע לי פגישה עם המנחה'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    multiline
                    maxRows={4}
                    autoFocus // Automatically focus the input when the modal opens
                />
                <IconButton color="primary" type="submit" disabled={isLoading || !input.trim()} aria-label="send message">
                    <SendIcon />
                </IconButton>
            </Box>
        </Dialog>
    );
}