// src/components/messages/MessageList.jsx

import React from 'react';
// Imports Material-UI components for building the list view.
import { Box, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, CircularProgress, Typography } from '@mui/material';

// This component is responsible for rendering a list of message conversations (threads).
// It displays the other participant's name and the last message for each thread.
// Props:
// - threads: An array of conversation thread objects.
// - selectedThreadId: The ID of the currently active conversation, used for styling.
// - onThreadSelect: A callback function to be executed when a user clicks on a thread.
// - isLoading: A boolean that shows a loading spinner when true.
// - currentUser: The currently logged-in user object, needed to identify the other participant in a thread.
const MessageList = ({ threads, selectedThreadId, onThreadSelect, isLoading, currentUser }) => {

    // This is a robust helper function designed to find the other participant in a 1-on-1 conversation.
    // It is written defensively to handle potential inconsistencies in the data structure,
    // ensuring the app remains stable even with legacy or malformed data.
    const getOtherParticipant = (thread) => {
        // First, perform basic validation to prevent errors.
        if (!thread || !thread.participants || !currentUser?.uid) return null;

        // --- Data Compatibility Fix ---
        // This logic handles two different data formats for `participants`.
        
        // 1. New Format Check: If `participants` is an array (the correct, current format),
        // find and return the participant whose UID does not match the current user's UID.
        if (Array.isArray(thread.participants)) {
            return thread.participants.find(p => p.uid !== currentUser.uid);
        }

        // 2. Legacy Fallback: If `participants` is an object (an older data format),
        // this block provides backward compatibility to prevent the app from crashing.
        if (typeof thread.participants === 'object') {
            const participantIds = Object.keys(thread.participants);
            const otherId = participantIds.find(id => id !== currentUser.uid);
            // Reconstruct a participant object from the old format if the other user is found.
            return otherId ? { uid: otherId, ...thread.participants[otherId] } : null;
        }

        // If the `participants` field is neither an array nor a valid object, return null.
        return null;
    };

    // If the data is currently being fetched, display a centered loading spinner.
    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>;
    }

    // If loading is complete but there are no threads, display a helpful message.
    if (!threads || threads.length === 0) {
        return <Box sx={{ p: 2, textAlign: 'center' }}><Typography color="text.secondary">No conversations found.</Typography></Box>;
    }

    // Render the list of conversation threads.
    return (
        <List sx={{ py: 0 }}>
            {threads.map(thread => {
                // For each thread, determine the other participant.
                const otherUser = getOtherParticipant(thread);
                
                // A critical guard clause: Do not attempt to render the list item if the other
                // user's data is incomplete (e.g., missing a displayName). This prevents broken UI elements.
                if (!otherUser?.displayName) return null;

                return (
                    // ListItemButton provides a clickable list item with hover and selected states.
                    <ListItemButton
                        key={thread.id}
                        onClick={() => onThreadSelect(thread)}
                        selected={selectedThreadId === thread.id}
                        // Custom styles for the selected state to override default MUI behavior if needed.
                        sx={{
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }
                        }}
                    >
                        <ListItemAvatar>
                            {/* Display the first letter of the other user's name in an Avatar. */}
                            <Avatar>{otherUser.displayName[0]?.toUpperCase() || '?'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={otherUser.displayName}
                            secondary={thread.lastMessage?.text || 'No messages yet'}
                            // Typography props to ensure long text doesn't wrap and break the layout.
                            primaryTypographyProps={{ fontWeight: 'bold', noWrap: true }}
                            secondaryTypographyProps={{ noWrap: true, textOverflow: 'ellipsis' }}
                        />
                    </ListItemButton>
                );
            })}
        </List>
    );
};

export default MessageList;