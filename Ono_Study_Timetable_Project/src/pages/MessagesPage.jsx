import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress, Alert, Stack, Button, LinearProgress, Skeleton } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { 
    getMessageThreadsForUser, 
    getMessagesForThread,
    sendMessageInThread, 
    createNewThread 
} from '../firebase/messagesService'; 

import MessageList from '../components/messages/MessageList';
import MessageThread from '../components/messages/MessageThread';
import MessageComposer from '../components/messages/MessageComposer';
import NewMessageModal from '../components/modals/NewMessageModal'; 
import AddCommentIcon from '@mui/icons-material/AddComment';

// קומפוננטות עזר להצגת שלדים
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

const MessageThreadSkeleton = () => (
    <Stack spacing={2} sx={{ p: 2, flex: 1 }}>
        <Skeleton variant="rounded" height={40} width="45%" sx={{ alignSelf: 'flex-start' }}/>
        <Skeleton variant="rounded" height={60} width="60%" sx={{ alignSelf: 'flex-end' }}/>
        <Skeleton variant="rounded" height={40} width="50%" sx={{ alignSelf: 'flex-start' }}/>
        <Skeleton variant="rounded" height={40} width="35%" sx={{ alignSelf: 'flex-end' }}/>
    </Stack>
);

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

    useEffect(() => {
        if (!currentUser?.uid) { setIsLoadingThreads(false); return; }
        setIsLoadingThreads(true);
        const unsubscribe = getMessageThreadsForUser(
            currentUser.uid, 
            (userThreads) => { setThreads(userThreads); setIsLoadingThreads(false); }, 
            (err) => { console.error(err); setError("Failed to load conversations."); setIsLoadingThreads(false); }
        );
        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!selectedThread?.id) { setMessages([]); return; }
        setIsLoadingMessages(true);
        const unsubscribe = getMessagesForThread(
            selectedThread.id, 
            (threadMessages) => { setMessages(threadMessages); setIsLoadingMessages(false); }, 
            (err) => { console.error(err); setError("Failed to load messages."); setIsLoadingMessages(false); }
        );
        return () => unsubscribe();
    }, [selectedThread]);

    const handleSendMessage = async (text, files) => {
        if (!selectedThread) return;
        setIsSending(true);
        try {
            const messageData = { senderId: currentUser.uid, text };
            await sendMessageInThread(selectedThread.id, messageData, files);
        } catch (error) { console.error(error); setError("Failed to send message."); } 
        finally { setIsSending(false); }
    };
    
    const handleCreateThread = async (recipient, initialMessageText, files) => {
        if (!recipient) return;
        setIsSending(true); setError(null);
        try {
            await createNewThread(currentUser, recipient, initialMessageText, files);
            setIsNewMessageModalOpen(false);
        } catch (error) { console.error(error); setError(error.message); } 
        finally { setIsSending(false); }
    };

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1400px', mx: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1">Messages</Typography>
                <Button variant="contained" startIcon={<AddCommentIcon />} onClick={() => setIsNewMessageModalOpen(true)}>New Message</Button>
            </Stack>

            <Box sx={{ height: 4, mb: 2 }}>
              {isSending && <LinearProgress />}
            </Box>

            {error && <Alert severity="error" sx={{mb: 2}} onClose={() => setError(null)}>{error}</Alert>}
            
            {/* ✨ התיקון כאן: החזרת הגובה לחישוב המקורי */}
            <Paper elevation={3} sx={{ display: 'flex', height: 'calc(100vh - 160px)' }}>
                
                {/* MessageList Area */}
                <Box sx={{ width: {xs: '40%', md: '30%'}, borderRight: '1px solid', borderColor: 'divider', overflowY: 'auto' }}>
                    {isLoadingThreads ? <ThreadListSkeleton /> : (
                        <MessageList threads={threads} selectedThreadId={selectedThread?.id} onThreadSelect={setSelectedThread} currentUser={currentUser} />
                    )}
                </Box>
                
                {/* MessageThread Area */}
                <Box sx={{ width: {xs: '60%', md: '70%'}, display: 'flex', flexDirection: 'column' }}>
                    {selectedThread ? (
                        <>
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6">
                                    {(Array.isArray(selectedThread.participants) && selectedThread.participants.find(p => p.uid !== currentUser.uid)?.displayName) || 'Conversation'}
                                </Typography>
                            </Box>
                            
                            {isLoadingMessages ? <MessageThreadSkeleton /> : (
                                <MessageThread messages={messages} currentUser={currentUser} />
                            )}
                            
                            <Divider />
                            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <MessageComposer onSend={handleSendMessage} disabled={isLoadingMessages || !selectedThread || isSending} />
                            </Box>
                        </>
                    ) : (
                        !isLoadingThreads && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}><Typography>Select or start a new conversation</Typography></Box>
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