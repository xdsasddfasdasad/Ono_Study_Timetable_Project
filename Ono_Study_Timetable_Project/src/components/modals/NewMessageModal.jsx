// src/components/modals/NewMessageModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
// Imports Material-UI components for the modal's layout and actions.
import { Stack, Alert, CircularProgress, Button, Box } from '@mui/material';
// Imports the reusable modal wrapper and the specific form for a new message.
import PopupModal from '../UI/PopupModal';
import NewMessageForm from './forms/NewMessageForm';
// Imports the service for fetching data from Firestore.
import { fetchCollection } from '../../firebase/firestoreService';

// Defines the initial, empty state for the form data.
const initialFormData = {
  recipient: '', // The recipient's unique ID.
  body: '',      // The text content of the message.
};

// This is a "smart" component that encapsulates the entire logic for a modal
// used to compose and send a new message, starting a new conversation thread.
// Props:
// - open: A boolean that controls the visibility of the modal.
// - onClose: A callback function to close the modal.
// - onSend: A callback that passes the composed message data up to the parent for sending.
// - isSending: A boolean passed from the parent to show a loading state during the send operation.
export default function NewMessageModal({
    open,
    onClose,
    onSend,
    isSending,
}) {
  // === STATE MANAGEMENT ===
  // This component manages all the state related to composing a new message.
  const [formData, setFormData] = useState(initialFormData);
  const [lecturers, setLecturers] = useState([]); // A list of potential recipients.
  const [attachedFiles, setAttachedFiles] = useState([]); // An array of selected file objects.
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false); // Loading state for the recipient list.
  const [error, setError] = useState(''); // Holds any client-side validation error messages.

  // This effect handles fetching recipient data when the modal opens and resetting state when it closes.
  useEffect(() => {
    if (open) {
      // When the modal opens, fetch the list of lecturers to populate the "To" field.
      setIsLoadingRecipients(true);
      setError('');
      fetchCollection('lecturers')
        .then(data => setLecturers(data || []))
        .catch(() => setError('Could not load recipients.'))
        .finally(() => setIsLoadingRecipients(false));
    } else {
      // When the modal closes, reset all state to ensure it's clean for the next use.
      setFormData(initialFormData);
      setAttachedFiles([]);
      setError('');
    }
  }, [open]);

  // A generic change handler for the form's text inputs, memoized for performance.
  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // A handler for the file input, memoized for performance.
  const handleFileChange = useCallback((event) => {
    if (event.target.files) {
      // Converts the FileList object into an array to be stored in state.
      setAttachedFiles(Array.from(event.target.files));
    }
  }, []);

  // The submit handler for the send button.
  const handleSubmit = () => {
    // Perform basic client-side validation.
    if (!formData.recipient || !formData.body.trim()) {
      setError('A recipient and message body are required.');
      return;
    }

    // Find the full recipient object from the list of lecturers.
    const recipientObject = lecturers.find(l => l.id === formData.recipient);
    if (!recipientObject) {
      setError('The selected recipient is invalid.');
      return;
    }

    // This is a key part of the "smart" container pattern. The modal itself doesn't know
    // *how* to send a message. It just gathers the data and calls the `onSend` function
    // passed down from its parent, which contains the actual sending logic.
    if (typeof onSend === 'function') {
      onSend(recipientObject, formData.body, attachedFiles);
    }
  };

  // A derived state to easily disable UI elements during any loading phase.
  const isActionDisabled = isLoadingRecipients || isSending;

  return (
    // The PopupModal provides the generic modal structure (dialog box, title, close button).
    <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Compose New Message">
      <Stack spacing={2} sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {/* Show a loading spinner while fetching recipients. */}
        {isLoadingRecipients ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          // Once loaded, render the "dumb" form component, passing all necessary data and handlers as props.
          <NewMessageForm
            formData={formData}
            onFormChange={handleFormChange}
            onFileChange={handleFileChange}
            lecturers={lecturers}
            attachedFiles={attachedFiles}
            disabled={isSending} // The form is disabled while the parent is processing the send request.
          />
        )}
        {/* Action buttons for the modal. */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button onClick={onClose} disabled={isActionDisabled}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isActionDisabled}>
            {/* The Send button shows a spinner based on the `isSending` prop from the parent. */}
            {isSending ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </PopupModal>
  );
}