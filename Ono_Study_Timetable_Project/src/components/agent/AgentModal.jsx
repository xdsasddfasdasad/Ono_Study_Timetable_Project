    // src/components/agent/AgentModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, Box, TextField, 
    IconButton, List, ListItem, ListItemText, CircularProgress, 
    Typography, Paper, Avatar 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { useAgent } from '../../context/AgentContext';

/**
 * A Dialog component that serves as the main chat interface for the AI Agent.
 * It reads its entire state from the AgentContext.
 */
export default function AgentModal() {
    // 1. Consume the global context to get all necessary state and functions.
    const { isAgentOpen, setIsAgentOpen, messages, isLoading, sendMessage } = useAgent();
    
    // 2. Local state for the input field.
    const [input, setInput] = useState('');
    
    // 3. Ref to automatically scroll to the bottom of the chat.
    const endOfMessagesRef = useRef(null);

    const handleSend = () => {
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevents adding a new line
            handleSend();
        }
    };
    
    // 4. Effect to scroll down whenever a new message is added.
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <Dialog 
            open={isAgentOpen} 
            onClose={() => setIsAgentOpen(false)} 
            fullWidth 
            maxWidth="md"
            PaperProps={{ sx: { height: '90vh' } }} // Make the dialog taller
        >
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                AI Assistant
            </DialogTitle>
            
            <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
                <List sx={{ p: 2 }}>
                    {messages.map((msg, index) => (
                        <ListItem 
                            key={index} 
                            sx={{ 
                                display: 'flex',
                                // Align user messages to the right, agent to the left
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, maxWidth: '80%' }}>
                                {msg.role === 'agent' && <Avatar sx={{ bgcolor: 'secondary.main' }}><SmartToyIcon /></Avatar>}
                                <Paper 
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                                        color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                        // Specific border radii for chat bubble effect
                                        borderTopLeftRadius: msg.role === 'user' ? 8 : 2,
                                        borderTopRightRadius: msg.role === 'user' ? 2 : 8,
                                    }}
                                >
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                                </Paper>
                                {msg.role === 'user' && <Avatar><PersonIcon /></Avatar>}
                            </Box>
                        </ListItem>
                    ))}
                    {/* The "Agent is typing..." indicator */}
                    {isLoading && (
                        <ListItem sx={{ justifyContent: 'flex-start' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}><SmartToyIcon /></Avatar>
                                <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2 }}><CircularProgress size={20}/></Paper>
                             </Box>
                        </ListItem>
                    )}
                    {/* This empty div is the target for our auto-scroll */}
                    <div ref={endOfMessagesRef} />
                </List>
            </DialogContent>

            {/* The input area */}
            <Box 
                component="form"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <TextField 
                    fullWidth 
                    variant="outlined"
                    placeholder="e.g., 'Schedule a dentist appointment for me tomorrow at 3pm'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    multiline
                    maxRows={4}
                />
                <IconButton color="primary" type="submit" disabled={isLoading || !input.trim()}>
                    <SendIcon />
                </IconButton>
            </Box>
        </Dialog>
    );
}