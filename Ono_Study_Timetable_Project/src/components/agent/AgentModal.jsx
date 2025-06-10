// src/components/agent/AgentModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
    Box, Paper, Typography, CircularProgress, Stack
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useAgent } from '../../context/AgentContext';

// רכיב פנימי להצגת הודעה בודדת
const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';
    const align = isUser ? 'right' : 'left';
    const bgColor = isUser ? 'primary.light' : 'grey.200';
    const textColor = isUser ? 'primary.contrastText' : 'text.primary';

    return (
        <Box sx={{ display: 'flex', justifyContent: align, mb: 2 }}>
            <Paper elevation={2} sx={{ p: 1.5, maxWidth: '80%', bgcolor: bgColor, color: textColor, borderRadius: '12px' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
            </Paper>
        </Box>
    );
};

export default function AgentModal() {
    const { isAgentOpen, setIsAgentOpen, messages, isLoading, sendMessage } = useAgent();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    // גלילה אוטומטית לתחתית הצ'אט כשהודעה חדשה מתווספת
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleClose = () => setIsAgentOpen(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        sendMessage({ role: 'user', text: input });
        setInput('');
    };

    return (
        <Dialog open={isAgentOpen} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { height: '80vh' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                יועץ לוח הזמנים AI
                <IconButton onClick={handleClose}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers ref={scrollRef} sx={{ bgcolor: 'grey.50' }}>
                {messages.map((msg, index) => (
                    // נציג רק הודעות טקסטואליות
                    msg.text && <ChatMessage key={index} message={msg} />
                ))}
                {isLoading && (
                    <Stack direction="row" spacing={2} alignItems="center">
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="text.secondary">חושב...</Typography>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="איך אפשר לעזור היום?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <IconButton type="submit" color="primary" disabled={isLoading || !input.trim()}>
                                    <SendIcon />
                                </IconButton>
                            )
                        }}
                    />
                </Box>
            </DialogActions>
        </Dialog>
    );
}