// src/components/messages/MessageList.jsx

import React from 'react';
import { Box, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, CircularProgress, Typography } from '@mui/material';

const MessageList = ({ threads, selectedThreadId, onThreadSelect, isLoading, currentUser }) => {

    /**
     * A robust helper function to find the other participant in a conversation.
     * It handles cases where `participants` might be an old object format or the new array format.
     */
    const getOtherParticipant = (thread) => {
        if (!thread || !thread.participants || !currentUser?.uid) return null;

        // --- THE CRITICAL FIX IS HERE ---
        // 1. Check if participants is an array (the new, correct format).
        if (Array.isArray(thread.participants)) {
            return thread.participants.find(p => p.uid !== currentUser.uid);
        }

        // 2. Fallback for the old object format, to prevent crashing on old data.
        if (typeof thread.participants === 'object') {
            const participantIds = Object.keys(thread.participants);
            const otherId = participantIds.find(id => id !== currentUser.uid);
            return otherId ? { uid: otherId, ...thread.participants[otherId] } : null;
        }

        // If it's neither, we can't process it.
        return null;
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>;
    }

    if (!threads || threads.length === 0) {
        return <Box sx={{ p: 2, textAlign: 'center' }}><Typography color="text.secondary">No conversations found.</Typography></Box>;
    }

    return (
        <List sx={{ py: 0 }}>
            {threads.map(thread => {
                const otherUser = getOtherParticipant(thread);
                // Skip rendering this thread if participant data is malformed or missing.
                if (!otherUser?.displayName) return null; 

                return (
                    <ListItemButton 
                        key={thread.id} 
                        onClick={() => onThreadSelect(thread)} 
                        selected={selectedThreadId === thread.id}
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
                            <Avatar>{otherUser.displayName[0]?.toUpperCase() || '?'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                            primary={otherUser.displayName} 
                            secondary={thread.lastMessage?.text || 'No messages yet'}
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