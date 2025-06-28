// src/firebase/messagesService.js

// This file serves as a dedicated service layer for all real-time messaging functionality.
// It abstracts the raw Firebase SDK calls for creating threads, sending messages,
// and listening for new messages and conversations.

import {
    collection, query, where, onSnapshot,
    orderBy, addDoc, setDoc, doc, serverTimestamp, getDoc, updateDoc
} from "firebase/firestore";
// Imports the necessary Firebase services.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, app } from './firebaseConfig';

// Define constants for collection names to avoid typos and make refactoring easier.
const THREADS_COLLECTION = 'messageThreads';
const MESSAGES_SUBCOLLECTION = 'messages';
const storage = getStorage(app);

/**
 * Attaches a real-time listener to fetch all message threads for a specific user.
 * @param {string} userId - The UID of the user whose threads to fetch.
 * @param {function} callback - The function to call with the array of threads whenever the data changes.
 * @param {function} onError - The function to call if an error occurs.
 * @returns {function} An unsubscribe function to detach the listener.
 */
export const getMessageThreadsForUser = (userId, callback, onError) => {
    const threadsRef = collection(db, THREADS_COLLECTION);
    // Create a query to find all threads where the user's ID is in the `participantIds` array.
    // Order the results by the timestamp of the last message to show the most recent conversations first.
    const q = query(threadsRef, where("participantIds", "array-contains", userId), orderBy("lastMessage.timestamp", "desc"));
    
    // `onSnapshot` creates a real-time listener. The callback will be executed immediately
    // with the initial data and then again every time the query results change.
    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        onError
    );
};

/**
 * Attaches a real-time listener to fetch all messages within a specific thread.
 * @param {string} threadId - The ID of the conversation thread.
 * @param {function} callback - The function to call with the array of messages whenever new messages arrive.
 * @param {function} onError - The function to call if an error occurs.
 * @returns {function} An unsubscribe function to detach the listener.
 */
export const getMessagesForThread = (threadId, callback, onError) => {
    console.log(`[messagesService] Attaching listener for messages in thread: ${threadId}`);
    // Messages are stored in a subcollection under their parent thread document.
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    // Query the messages and order them by their creation time to display them chronologically.
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, 
        (snapshot) => callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
        (error) => {
            console.error(`Error fetching messages for thread ${threadId}:`, error);
            onError(error);
        }
    );
};

/**
 * Sends a new message to an existing thread and updates the thread's metadata.
 * @param {string} threadId - The ID of the thread to send the message to.
 * @param {Object} messageData - The message payload, containing senderId and text.
 * @param {Array<File>} [files=[]] - An array of files to be attached (future implementation).
 */
export const sendMessageInThread = async (threadId, messageData, files = []) => {
    // This function adds a new message document to the 'messages' subcollection of a thread.
    const messagePayload = {
        ...messageData,
        createdAt: serverTimestamp(), // Use a server-side timestamp for accuracy and consistency.
        attachments: [], // Placeholder for future file attachment functionality.
    };
    const messagesRef = collection(db, THREADS_COLLECTION, threadId, MESSAGES_SUBCOLLECTION);
    await addDoc(messagesRef, messagePayload);

    // After adding the message, update the parent thread document with information
    // about the last message, which is used for sorting and displaying previews.
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    await updateDoc(threadRef, {
        lastMessage: {
            text: (messageData.text || "File sent").substring(0, 50), // A short preview of the message.
            senderId: messageData.senderId,
            timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
    });
};

/**
 * Creates a new message thread if one doesn't already exist between two participants,
 * and then sends the initial message.
 * @param {Object} sender - The user object of the person sending the message.
 * @param {Object} recipient - The user object of the recipient.
 * @param {string} initialMessageText - The text of the first message.
 * @param {Array<File>} [files=[]] - An array of files to attach.
 * @returns {Promise<{success: boolean, threadId: string}>} An object indicating success and the thread's ID.
 */
export const createNewThread = async (sender, recipient, initialMessageText, files = []) => {
    // Create a predictable, unique thread ID by sorting the participants' UIDs and joining them.
    // This ensures that any two users will always have the same thread ID, preventing duplicate threads.
    const participantIds = [sender.uid, recipient.id].sort();
    const threadId = participantIds.join('_');
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);
    
    // If a thread document with this ID doesn't already exist, create it.
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
    
    // After ensuring the thread exists, send the initial message to it.
    const messageData = { senderId: sender.uid, text: initialMessageText };
    await sendMessageInThread(threadId, messageData, files);
    return { success: true, threadId };
};