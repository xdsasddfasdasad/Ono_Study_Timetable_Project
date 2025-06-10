// src/firebase/messagesService.js

import {
    collection, query, where, onSnapshot,
    orderBy, addDoc, setDoc, doc, serverTimestamp, getDoc, updateDoc
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, app } from './firebaseConfig'; // Make sure this path is correct

const THREADS_COLLECTION = 'messageThreads';
const MESSAGES_SUBCOLLECTION = 'messages';
const storage = getStorage(app);

// --- FUNCTION TO LISTEN FOR THREADS (This is likely correct as is) ---
export const getMessageThreadsForUser = (userId, callback, onError) => {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(threadsRef, where("participantIds", "array-contains", userId), orderBy("lastMessage.timestamp", "desc"));
    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        onError
    );
};

// --- FUNCTION TO LISTEN FOR MESSAGES (This is likely correct as is) ---
export const getMessagesForThread = (threadId, callback, onError) => {
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        onError
    );
};

// --- FUNCTION TO SEND A MESSAGE IN AN EXISTING THREAD (This is likely correct as is) ---
export const sendMessageInThread = async (threadId, messageData) => {
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    await addDoc(messagesRef, { ...messageData, createdAt: serverTimestamp() });
    
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

// --- THIS IS THE FUNCTION THAT NEEDS THE CRITICAL FIX ---
/**
 * Creates a new message thread if one doesn't exist, and sends the first message.
 */
export const createNewThread = async (sender, recipient, initialMessageText, files = []) => {
    if (!recipient?.id || !initialMessageText || !sender?.uid) {
        throw new Error("Recipient, message, and sender are required.");
    }
    
    const participantIds = [sender.uid, recipient.id].sort();
    const threadId = participantIds.join('_');
    const threadRef = doc(db, THREADS_COLLECTION, threadId);

    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
        console.log(`[messagesService] Thread ${threadId} does not exist. Creating with CORRECT participants structure...`);
        
        // --- THE CRITICAL FIX IS HERE ---
        // We MUST save `participants` as an ARRAY of OBJECTS.
        const threadData = {
            participantIds: participantIds,
            participants: [ // It MUST be an array `[]`
                { uid: sender.uid, displayName: `${sender.firstName} ${sender.lastName}`.trim() },
                { uid: recipient.id, displayName: recipient.name || `${recipient.firstName} ${recipient.lastName}`.trim() }
            ],
            createdAt: serverTimestamp(),
            // Initialize lastMessage so the field exists for ordering
            lastMessage: { text: "", timestamp: serverTimestamp() }, 
        };
        await setDoc(threadRef, threadData);
    }
    
    // Upload files if they exist
    let attachments = [];
    if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
            const filePath = `message-attachments/${threadId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return { name: file.name, url: downloadURL, path: filePath };
        });
        attachments = await Promise.all(uploadPromises);
    }

    // Send the first message, including attachments
    const messageData = {
        senderId: sender.uid,
        text: initialMessageText,
        attachments: attachments,
    };
    await sendMessageInThread(threadId, messageData);
    
    // Return success
    return { success: true };
};