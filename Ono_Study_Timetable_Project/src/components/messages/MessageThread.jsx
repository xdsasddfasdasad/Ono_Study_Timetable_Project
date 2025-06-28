// src/components/messages/MessageThread.jsx

import React from 'react';
// Imports Material-UI components for structuring the chat interface.
import { Box, Stack, Paper, Typography, CircularProgress, Link as MuiLink, Chip } from '@mui/material';
// Imports a date formatting function from the 'date-fns' library.
import { format } from 'date-fns';
// Imports an icon to represent file attachments.
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// This component renders the sequence of messages within a selected conversation thread.
// It handles displaying messages from both the current user and the other participant,
// styling them differently for clarity.
// Props:
// - messages: An array of message objects for the current thread.
// - isLoading: A boolean that shows a loading spinner while messages are being fetched.
// - currentUser: The currently logged-in user object, needed to determine if a message was sent or received.
const MessageThread = ({ messages, isLoading, currentUser }) => {
    // If messages are still loading, display a centered spinner.
    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
    }

    // The main container for the message list.
    // This uses a clever flexbox trick: `flexDirection: 'column-reverse'`.
    // This arranges items from bottom to top, which means the scrollbar starts at the bottom by default.
    // This keeps the most recent messages in view without complex JavaScript or ref manipulation.
    return (
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
            <Stack spacing={2}>
                {/* We use .slice() to create a shallow copy before reversing to avoid mutating the original prop array.
                    Because the parent container is 'column-reverse', we must reverse our array to ensure messages
                    are displayed in the correct chronological order (oldest at the top, newest at the bottom). */}
                {messages.slice().reverse().map(msg => (
                    // Each message is rendered in a Paper component, which acts as the "bubble".
                    <Paper
                        key={msg.id}
                        elevation={1}
                        sx={{
                            p: 1.5,
                            // This is the core logic for alignment. 'flex-end' (right) for the current user's messages,
                            // and 'flex-start' (left) for received messages.
                            alignSelf: msg.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                            // The background and text color are also dynamically set based on the sender.
                            bgcolor: msg.senderId === currentUser.uid ? 'primary.light' : 'grey.200',
                            color: msg.senderId === currentUser.uid ? 'primary.contrastText' : 'text.primary',
                            // Prevents a message bubble from being excessively wide on large screens.
                            maxWidth: '70%',
                            // This applies different border radiuses to create a "tailed" chat bubble effect.
                            borderRadius: msg.senderId === currentUser.uid ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                        }}
                    >
                        {/* Conditionally render the message text if it exists. */}
                        {msg.text && (
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: msg.attachment ? 1 : 0 }}>
                                {msg.text}
                            </Typography>
                        )}

                        {/* Conditionally render the file attachment as a clickable link if it exists. */}
                        {msg.attachment && msg.attachment.url && (
                            <MuiLink href={msg.attachment.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                                {/* The Chip provides a clean UI for the attachment link. */}
                                <Chip
                                    icon={<InsertDriveFileIcon />}
                                    label={msg.attachment.name || 'View Attachment'}
                                    clickable
                                    // Using component="div" is important here to prevent nesting an <a> tag (from the Chip)
                                    // inside another <a> tag (from MuiLink), which is invalid HTML.
                                    component="div"
                                />
                            </MuiLink>
                        )}

                        {/* The timestamp for the message. */}
                        <Typography
                            variant="caption"
                            sx={{
                                display: 'block',
                                textAlign: 'right',
                                mt: 0.5,
                                // Timestamp color is also dynamic for better readability on different bubble backgrounds.
                                color: msg.senderId === currentUser.uid ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                            }}
                        >
                            {/* Format the Firebase Timestamp object to a readable time string (HH:mm).
                                The check 'msg.createdAt?' is a safeguard in case the data is missing. */}
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '...'}
                        </Typography>
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};

export default MessageThread;