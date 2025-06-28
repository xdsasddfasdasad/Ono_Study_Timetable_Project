// src/components/messages/MessageComposer.jsx

import React, { useState, useRef } from 'react';
// Imports Material-UI components for building the composer's interface.
import { Stack, TextField, Button, IconButton, Box, Chip } from '@mui/material';
// Imports icons for the attachment and clear buttons.
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';

// This component provides a user interface for composing a message,
// including a text field and an option to add a single file attachment.
// It manages its internal state but delegates the actual "send" action
// to a parent component via the `onSend` prop.
// - 'onSend': A function that will be called with the message text and attachment file when the user clicks send.
// - 'disabled': A boolean to disable the entire composer UI, e.g., while a message is being sent.
const MessageComposer = ({ onSend, disabled = false }) => {
    // State to hold the current text content of the message.
    const [text, setText] = useState('');
    // State to hold the selected file object for the attachment.
    const [attachment, setAttachment] = useState(null);
    // A ref to programmatically access the hidden file input element.
    const fileInputRef = useRef(null);

    // This handler is triggered when a user selects a file from their system.
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Here you could add validation for file size, type, etc.
            setAttachment(file);
        }
    };

    // This handler removes the currently selected attachment.
    const handleRemoveAttachment = () => {
        setAttachment(null);
        // It's important to reset the file input's value. If we don't, the `onChange` event
        // won't fire if the user tries to select the exact same file again.
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // This handler is called when the form is submitted (user clicks "Send" or presses Enter).
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent the default browser form submission which causes a page reload.
        
        // Don't send if there is no content (neither text nor an attachment).
        if (!text.trim() && !attachment) return;

        // Call the parent component's onSend function, passing the current text and file object.
        onSend(text, attachment);

        // Reset the composer's state to be ready for the next message.
        setText('');
        handleRemoveAttachment();
    };

    // The component is wrapped in a <form> element to enable submission via the Enter key.
    return (
        <form onSubmit={handleSubmit}>
            {/* Stack is used to arrange the elements vertically with consistent spacing. */}
            <Stack spacing={1}>
                {/* The main text input field for the message. */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={disabled}
                    multiline
                    maxRows={4} // Allows the text field to grow up to 4 lines.
                />
                {/* This section is only rendered if an attachment has been selected. */}
                {attachment && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        {/* The Chip component provides a nice UI for displaying the file name. */}
                        <Chip
                            icon={<AttachFileIcon />}
                            label={attachment.name}
                            onDelete={handleRemoveAttachment}
                            deleteIcon={<ClearIcon />}
                            color="info"
                        />
                    </Box>
                )}
                {/* This stack arranges the attachment button and send button on a single row. */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    {/* This IconButton triggers the hidden file input when clicked. */}
                    <IconButton onClick={() => fileInputRef.current?.click()} disabled={disabled}>
                        <AttachFileIcon />
                    </IconButton>
                    {/* The actual file input is hidden from the user. We trigger it programmatically. */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {/* The submit button for the form. */}
                    <Button type="submit" variant="contained" disabled={disabled || (!text.trim() && !attachment)}>
                        Send
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default MessageComposer;