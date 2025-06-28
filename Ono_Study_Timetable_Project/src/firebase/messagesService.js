// src/firebase/messagesService.js

import {
    collection, query, where, onSnapshot,
    orderBy, addDoc, setDoc, doc, serverTimestamp, getDoc, updateDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, app } from './firebaseConfig'; // Ensure this path is correct

const THREADS_COLLECTION = 'messageThreads';
const MESSAGES_SUBCOLLECTION = 'messages';
const storage = getStorage(app);

// --- FUNCTION 1 ---
export const getMessageThreadsForUser = (userId, callback, onError) => {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(threadsRef, where("participantIds", "array-contains", userId), orderBy("lastMessage.timestamp", "desc"));
    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        onError
    );
};

// --- FUNCTION 2 (THE ONE CAUSING THE ERROR) ---
export const getMessagesForThread = (threadId, callback, onError) => {
    console.log(`[messagesService] Attaching listener for messages in thread: ${threadId}`);
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (error) => {
            console.error(`Error fetching messages for thread ${threadId}:`, error);
            onError(error);
        }
    );
};

// --- FUNCTION 3 ---
export const sendMessageInThread = async (threadId, messageData, files = []) => {
    // This function adds a message to an existing thread.
    // File upload logic can be integrated here.
    const messagePayload = {
        ...messageData,
        createdAt: serverTimestamp(),
        attachments: [], // Placeholder for attachments
    };
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    await addDoc(messagesRef, messagePayload);

    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
        lastMessage: {
            text: (messageData.text || "File sent").substring(0, 50),
            senderId: messageData.senderId,
            timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
    });
};

// --- FUNCTION 4 ---
export const createNewThread = async (sender, recipient, initialMessageText, files = []) => {
    const participantIds = [sender.uid, recipient.id].sort();
    const threadId = participantIds.join('_');
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
        const threadData = {
            participantIds,
            participants: [
                { uid: sender.uid, displayName: `${sender.firstName} ${sender.lastName}`.trim() },
                { uid: recipient.id, displayName: recipient.name || `${recipient.firstName} ${recipient.lastName}`.trim() }
            ],
            createdAt: serverTimestamp(),
            lastMessage: { text: "", timestamp: serverTimestamp() }, 
        };
        await setDoc(threadRef, threadData);
    }
    
    const messageData = { senderId: sender.uid, text: initialMessageText };
    await sendMessageInThread(threadId, messageData, files);
    return { success: true, threadId };
};