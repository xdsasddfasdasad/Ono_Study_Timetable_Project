// src/pages/MessagesPage.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress, Alert, Stack, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// --- THE CRITICAL IMPORT STATEMENT ---
// Verify this path is correct and that all four functions are listed.
import { 
    getMessageThreadsForUser, 
    getMessagesForThread,       // The function that was causing the error
    sendMessageInThread, 
    createNewThread 
} from '../firebase/messagesService'; 

import MessageList from '../components/messages/MessageList';
import MessageThread from '../components/messages/MessageThread';
import MessageComposer from '../components/messages/MessageComposer';
import NewMessageModal from '../components/modals/NewMessageModal'; 
import AddCommentIcon from '@mui/icons-material/AddComment';

export default function MessagesPage() {
    const { currentUser } = useAuth();
    const [threads, setThreads] = useState([]);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

    // Effect to fetch user's message threads
    useEffect(() => {
        if (!currentUser?.uid) {
            setIsLoadingThreads(false);
            return;
        }
        setIsLoadingThreads(true);
        const unsubscribe = getMessageThreadsForUser(
            currentUser.uid, 
            (userThreads) => {
                setThreads(userThreads);
                setIsLoadingThreads(false);
            }, 
            (err) => {
                console.error(err);
                setError("Failed to load conversations.");
                setIsLoadingThreads(false);
            }
        );
        return () => unsubscribe();
    }, [currentUser]);

    // Effect to fetch messages for the selected thread
    useEffect(() => {
        if (!selectedThread?.id) {
            setMessages([]);
            return;
        }
        setIsLoadingMessages(true);
        // This is the line that was crashing (line 54 in your example)
        const unsubscribe = getMessagesForThread(
            selectedThread.id, 
            (threadMessages) => {
                setMessages(threadMessages);
                setIsLoadingMessages(false);
            }, 
            (err) => {
                console.error(err);
                setError("Failed to load messages.");
                setIsLoadingMessages(false);
            }
        );
        return () => unsubscribe();
    }, [selectedThread]);

    // Handler for sending a message in an existing thread
    const handleSendMessage = async (text, files) => {
        if (!selectedThread) return;
        setIsSending(true);
        try {
            const messageData = { senderId: currentUser.uid, text };
            await sendMessageInThread(selectedThread.id, messageData, files);
        } catch (error) { 
            console.error(error);
            setError("Failed to send message."); 
        } finally {
            setIsSending(false);
        }
    };
    
    // Handler for creating a new thread from the modal
    const handleCreateThread = async (recipient, initialMessageText, files) => {
        if (!recipient) return;
        setIsSending(true);
        setError(null);
        try {
            await createNewThread(currentUser, recipient, initialMessageText, files);
            setIsNewMessageModalOpen(false);
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1400px', mx: 'auto' }}>
            {/* The rest of the JSX remains exactly the same as the correct version you provided */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1">Messages</Typography>
                <Button variant="contained" startIcon={<AddCommentIcon />} onClick={() => setIsNewMessageModalOpen(true)}>New Message</Button>
            </Stack>
            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}
            <Paper elevation={3} sx={{ display: 'flex', height: 'calc(100vh - 160px)' }}>
                {/* MessageList */}
                <Box sx={{ width: {xs: '40%', md: '30%'}, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
                    <MessageList threads={threads} selectedThreadId={selectedThread?.id} onThreadSelect={setSelectedThread} isLoading={isLoadingThreads} currentUser={currentUser} />
                </Box>
                {/* MessageThread */}
                <Box sx={{ width: {xs: '60%', md: '70%'}, display: 'flex', flexDirection: 'column' }}>
                    {selectedThread ? (
                        <>
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                {/* The protected logic for finding the other participant's name */}
                                <Typography variant="h6">
                                    {(Array.isArray(selectedThread.participants) && selectedThread.participants.find(p => p.uid !== currentUser.uid)?.displayName) || 'Conversation'}
                                </Typography>
                            </Box>
                            <MessageThread messages={messages} isLoading={isLoadingMessages} currentUser={currentUser} />
                            <Divider />
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <MessageComposer onSend={handleSendMessage} disabled={isLoadingMessages || !selectedThread || isSending} />
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}><Typography>Select or start a new conversation</Typography></Box>
                    )}
                </Box>
            </Paper>

            <NewMessageModal 
                open={isNewMessageModalOpen}
                onClose={() => setIsNewMessageModalOpen(false)}
                onSend={handleCreateThread}
                isSending={isSending}
            />
        </Box>
    );
}