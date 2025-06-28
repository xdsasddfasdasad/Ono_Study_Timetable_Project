// src/pages/MessagesPage.jsx

import React, { useState, useEffect } from 'react';
// Imports a wide range of Material-UI components for building the two-pane chat layout.
import { Box, Typography, Stack, Paper, Alert, LinearProgress, Skeleton } from '@mui/material';
// Imports the context to get the currently authenticated user.
import { useAuth } from '../context/AuthContext';
// Imports the dedicated real-time messaging services.
import { 
    getMessageThreadsForUser, 
    getMessagesForThread,
    sendMessageInThread, 
    createNewThread 
} from '../firebase/messagesService'; 

// Imports the sub-components that make up the messaging UI.
import MessageList from '../components/messages/MessageList';
import MessageThread from '../components/messages/MessageThread';
import MessageComposer from '../components/messages/MessageComposer';
import NewMessageModal from '../components/modals/NewMessageModal'; 
// Imports an icon for the "New Message" button.
import AddCommentIcon from '@mui/icons-material/AddComment';

// --- Skeleton Components for Loading UX ---
// A helper component to show a placeholder for the list of conversation threads.
const ThreadListSkeleton = () => (
    <Stack spacing={1} sx={{ p: 1 }}>
        {Array.from({ length: 6 }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2} alignItems="center" sx={{ p: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="90%" />
                </Box>
            </Stack>
        ))}
    </Stack>
);

// A helper component to show a placeholder for the messages within a conversation.
const MessageThreadSkeleton = () => (
    <Stack spacing={2} sx={{ p: 2, flex: 1 }}>
        <Skeleton variant="rounded" height={40} width="45%" sx={{ alignSelf: 'flex-start' }}/>
        <Skeleton variant="rounded" height={60} width="60%" sx={{ alignSelf: 'flex-end' }}/>
        <Skeleton variant="rounded" height={40} width="50%" sx={{ alignSelf: 'flex-start' }}/>
        <Skeleton variant="rounded" height={40} width="35%" sx={{ alignSelf: 'flex-end' }}/>
    </Stack>
);

// This is the main "smart" page component for the entire real-time messaging feature.
// It orchestrates data fetching, state management, and user interactions.
export default function MessagesPage() {
    const { currentUser } = useAuth();
    // === STATE MANAGEMENT ===
    const [threads, setThreads] = useState([]); // Holds the list of user's conversation threads.
    const [selectedThread, setSelectedThread] = useState(null); // The currently active conversation.
    const [messages, setMessages] = useState([]); // The messages for the currently selected thread.
    const [isLoadingThreads, setIsLoadingThreads] = useState(true); // Loading state for the conversation list.
    const [isLoadingMessages, setIsLoadingMessages] = useState(false); // Loading state for the messages in a thread.
    const [isSending, setIsSending] = useState(false); // Loading state for when a message is being sent.
    const [error, setError] = useState(null);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

    // --- REAL-TIME DATA FETCHING ---
    // This effect subscribes to the user's list of conversation threads.
    useEffect(() => {
        if (!currentUser?.uid) { setIsLoadingThreads(false); return; }
        setIsLoadingThreads(true);
        // `getMessageThreadsForUser` returns an `unsubscribe` function from Firestore's `onSnapshot`.
        const unsubscribe = getMessageThreadsForUser(
            currentUser.uid, 
            (userThreads) => { setThreads(userThreads); setIsLoadingThreads(false); }, 
            (err) => { console.error(err); setError("Failed to load conversations."); setIsLoadingThreads(false); }
        );
        // The cleanup function for this effect is to call `unsubscribe` to prevent memory leaks.
        return () => unsubscribe();
    }, [currentUser]); // This effect re-subscribes if the user logs in or out.

    // This effect subscribes to the messages within the currently selected thread.
    useEffect(() => {
        if (!selectedThread?.id) { setMessages([]); return; }
        setIsLoadingMessages(true);
        // Attach a real-time listener for the messages subcollection of the selected thread.
        const unsubscribe = getMessagesForThread(
            selectedThread.id, 
            (threadMessages) => { setMessages(threadMessages); setIsLoadingMessages(false); }, 
            (err) => { console.error(err); setError("Failed to load messages."); setIsLoadingMessages(false); }
        );
        // When the selected thread changes, the old listener is unsubscribed, and a new one is created.
        return () => unsubscribe();
    }, [selectedThread]); // This effect re-subscribes whenever `selectedThread` changes.

    // --- ACTION HANDLERS ---
    // Handles sending a message within an existing, selected conversation.
    const handleSendMessage = async (text, files) => {
        if (!selectedThread) return;
        setIsSending(true);
        try {
            const messageData = { senderId: currentUser.uid, text };
            await sendMessageInThread(selectedThread.id, messageData, files);
        } catch (error) { console.error(error); setError("Failed to send message."); } 
        finally { setIsSending(false); }
    };
    
    // Handles creating a brand new conversation thread and sending the first message.
    const handleCreateThread = async (recipient, initialMessageText, files) => {
        if (!recipient) return;
        setIsSending(true); setError(null);
        try {
            await createNewThread(currentUser, recipient, initialMessageText, files);
            setIsNewMessageModalOpen(false); // Close the modal on success.
        } catch (error) { console.error(error); setError(error.message); } 
        finally { setIsSending(false); }
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1400px', mx: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1">Messages</Typography>
                <Button variant="contained" startIcon={<AddCommentIcon />} onClick={() => setIsNewMessageModalOpen(true)}>New Message</Button>
            </Stack>

            {/* A global loading bar for when a message is being sent. */}
            <Box sx={{ height: 4, mb: 2 }}>
              {isSending && <LinearProgress />}
            </Box>

            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}
            
            {/* The main two-pane layout for the chat interface. */}
            <Paper elevation={3} sx={{ display: 'flex', height: 'calc(100vh - 160px)' }}>
                
                {/* Left Pane: Conversation List */}
                <Box sx={{ width: {xs: '40%', md: '30%'}, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
                    {isLoadingThreads ? <ThreadListSkeleton /> : (
                        <MessageList threads={threads} selectedThreadId={selectedThread?.id} onThreadSelect={setSelectedThread} currentUser={currentUser} />
                    )}
                </Box>
                
                {/* Right Pane: Message Thread and Composer */}
                <Box sx={{ width: {xs: '60%', md: '70%'}, display: 'flex', flexDirection: 'column' }}>
                    {selectedThread ? (
                        <>
                            {/* Header for the selected conversation */}
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6">
                                    {/* Find the display name of the other participant in the conversation. */}
                                    {(Array.isArray(selectedThread.participants) && selectedThread.participants.find(p => p.uid !== currentUser.uid)?.displayName) || 'Conversation'}
                                </Typography>
                            </Box>
                            
                            {/* The message display area */}
                            {isLoadingMessages ? <MessageThreadSkeleton /> : (
                                <MessageThread messages={messages} currentUser={currentUser} />
                            )}
                            
                            <Divider />
                            {/* The message composer at the bottom */}
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <MessageComposer onSend={handleSendMessage} disabled={isLoadingMessages || !selectedThread || isSending} />
                            </Box>
                        </>
                    ) : (
                        // Show a placeholder if no conversation is selected.
                        !isLoadingThreads && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}><Typography>Select or start a new conversation</Typography></Box>
                    )}
                </Box>
            </Paper>

            {/* The modal for composing a new message, which is controlled by this page. */}
            <NewMessageModal 
                open={isNewMessageModalOpen}
                onClose={() => setIsNewMessageModalOpen(false)}
                onSend={handleCreateThread}
                isSending={isSending}
            />
        </Box>
    );
}