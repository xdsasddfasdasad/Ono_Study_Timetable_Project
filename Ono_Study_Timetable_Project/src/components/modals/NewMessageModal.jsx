// src/components/modals/NewMessageModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Stack, Alert, CircularProgress, Button, Box } from '@mui/material';
import PopupModal from '../UI/PopupModal';
import NewMessageForm from './forms/NewMessageForm';
import { fetchCollection } from '../../firebase/firestoreService';

const initialFormData = {
  recipient: '', // The recipient's ID
  body: '',      // The message content
};

/**
 * A modal for composing a new message thread. It fetches recipients
 * and passes the user's input up to the parent component via the `onSend` prop.
 */
export default function NewMessageModal({ 
    open, 
    onClose, 
    onSend, // This is the function passed from MessagesPage.jsx
    isSending, // This prop controls the loading state from the parent
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [lecturers, setLecturers] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [error, setError] = useState('');
  
  // Effect to load lecturers
  useEffect(() => {
    if (open) {
      setIsLoadingRecipients(true);
      setError('');
      fetchCollection('lecturers')
        .then(data => setLecturers(data || []))
        .catch(() => setError('Could not load recipients.'))
        .finally(() => setIsLoadingRecipients(false));
    } else {
      setFormData(initialFormData);
      setAttachedFiles([]);
      setError('');
    }
  }, [open]);

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((event) => {
    if (event.target.files) {
      setAttachedFiles(Array.from(event.target.files));
    }
  }, []);

  const handleSubmit = () => {
    if (!formData.recipient || !formData.body) {
      setError('Recipient and message are required.');
      return;
    }
    
    const recipientObject = lecturers.find(l => l.id === formData.recipient);
    if (!recipientObject) {
      setError('Selected recipient is invalid.');
      return;
    }
    
    // Call the onSend function passed from the parent (MessagesPage.jsx)
    if (typeof onSend === 'function') {
      onSend(recipientObject, formData.body, attachedFiles);
    }
  };

  const isActionDisabled = isLoadingRecipients || isSending;

  return (
    <PopupModal open={open} onClose={() => !isActionDisabled && onClose()} title="Compose New Message">
      <Stack spacing={2} sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {isLoadingRecipients ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <NewMessageForm
            formData={formData}
            onFormChange={handleFormChange}
            onFileChange={handleFileChange}
            lecturers={lecturers}
            attachedFiles={attachedFiles}
            disabled={isSending}
          />
        )}
        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button onClick={onClose} disabled={isActionDisabled}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={isActionDisabled}>
            {isSending ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </PopupModal>
  );
}