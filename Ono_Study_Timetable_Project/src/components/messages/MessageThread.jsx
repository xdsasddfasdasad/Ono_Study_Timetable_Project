import React from 'react';
import { Box, Stack, Paper, Typography, CircularProgress, Link as MuiLink, Chip } from '@mui/material';
import { format } from 'date-fns';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const MessageThread = ({ messages, isLoading, currentUser }) => {
    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
            <Stack spacing={2}>
                {messages.slice().reverse().map(msg => (
                    <Paper 
                        key={msg.id} 
                        elevation={1} 
                        sx={{ 
                            p: 1.5, 
                            alignSelf: msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                            bgcolor: msg.senderId === currentUser.uid ? 'primary.light' : 'grey.200',
                            color: msg.senderId === currentUser.uid ? 'primary.contrastText' : 'text.primary',
                            maxWidth: '70%',
                            borderRadius: msg.senderId === currentUser.uid ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                        }}
                    >
                        {/* Display text content if it exists */}
                        {msg.text && (
                            <Typography variant="body1" sx={{whiteSpace: 'pre-wrap', mb: msg.attachment ? 1 : 0}}>
                                {msg.text}
                            </Typography>
                        )}
                        
                        {/* Display attachment as a clickable chip if it exists */}
                        {msg.attachment && msg.attachment.url && (
                            <MuiLink href={msg.attachment.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                                <Chip
                                    icon={<InsertDriveFileIcon />}
                                    label={msg.attachment.name || 'View Attachment'}
                                    clickable
                                    sx={{ cursor: 'pointer', maxWidth: '100%' }}
                                    component="div" // Use div to prevent nested link issues
                                />
                            </MuiLink>
                        )}

                        <Typography 
                            variant="caption" 
                            sx={{ 
                                display: 'block', 
                                textAlign: 'right', 
                                mt: 0.5,
                                color: msg.senderId === currentUser.uid ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                            }}
                        >
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                        </Typography>
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};

export default MessageThread;