// src/components/AIAgentConsole.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Paper, Typography, Stack } from '@mui/material';
import { runAIAgent } from '../services/geminiService';
import { agentTools } from '../config/aiTools';

export default function AIAgentConsole({ onFunctionCall, onTextResponse }) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        setIsLoading(true);
        try {
            const result = await runAIAgent(input, agentTools);
            
            if (result.type === 'function_call') {
                // Pass the requested function call to the parent component to handle
                onFunctionCall(result.call);
            } else {
                // Pass the simple text response to the parent
                onTextResponse(result.text);
            }
        } catch (error) {
            console.error("Error running AI Agent:", error);
            onTextResponse("Sorry, I encountered an error. Please try again.");
        } finally {
            setIsLoading(false);
            setInput('');
        }
    };

    return (
        <Paper elevation={4} sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6" gutterBottom>AI Agent Console</Typography>
            <Box component="form" onSubmit={handleSubmit}>
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 'Show meetings for next week' or 'Schedule a sync-up on Friday at 10am'"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" variant="contained" disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Send'}
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}