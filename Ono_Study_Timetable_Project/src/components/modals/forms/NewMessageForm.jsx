// src/components/forms/NewMessageForm.jsx

import React from 'react';
// Imports Material-UI components for building the form's layout and elements.
import { Stack, FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, Typography, Chip } from '@mui/material';
// Imports the icon used for the file attachment button.
import AttachFileIcon from '@mui/icons-material/AttachFile';

// This is a "presentational" or "dumb" component. Its only job is to render the UI for a new message form.
// It is completely controlled by its parent component. It holds no internal state and contains no business logic.
// This design pattern makes it highly reusable, predictable, and easy to test.
// Props:
// - formData: An object containing the current values for the form's inputs (e.g., recipient, body).
// - onFormChange: A callback function to handle changes in the recipient dropdown and message text area.
// - onFileChange: A separate callback to handle when a user selects files.
// - lecturers: An array of lecturer objects used to populate the recipient dropdown.
// - attachedFiles: An array of File objects that the user has selected.
// - disabled: A boolean to disable the entire form, typically during a submission process.
export default function NewMessageForm({
    formData,
    onFormChange,
    onFileChange,
    lecturers = [],
    attachedFiles = [],
    disabled = false
}) {
    return (
        // The Stack component arranges the form sections vertically with consistent spacing.
        <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Recipient Selection Dropdown */}
            <FormControl fullWidth required disabled={disabled}>
                <InputLabel id="recipient-lecturer-label">To</InputLabel>
                <Select
                    labelId="recipient-lecturer-label"
                    name="recipient" // The name corresponds to the key in the formData object.
                    value={formData.recipient || ''}
                    label="To"
                    onChange={onFormChange} // Reports any change back to the parent component.
                >
                    <MenuItem value="" disabled><em>Select a lecturer...</em></MenuItem>
                    {/* The dropdown options are dynamically generated from the 'lecturers' prop. */}
                    {lecturers.map((lecturer) => (
                        <MenuItem key={lecturer.id} value={lecturer.id}>
                            {lecturer.name || `${lecturer.firstName} ${lecturer.lastName}`}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Message Body Text Field */}
            <TextField
                fullWidth
                required
                multiline // Allows for multiple lines of text.
                rows={8}    // Sets the initial height of the text area.
                name="body" // Corresponds to the 'body' key in formData.
                label="Message"
                value={formData.body || ''}
                onChange={onFormChange}
                disabled={disabled}
            />

            {/* File Attachment Section */}
            <Stack spacing={1}>
                {/* This is a common and effective pattern for custom file upload buttons. */}
                {/* The Button component is rendered as a <label> which is associated with the hidden input. */}
                <Button
                    variant="outlined"
                    component="label" // This makes the button act as a label.
                    startIcon={<AttachFileIcon />}
                    disabled={disabled}
                >
                    Attach Files
                    {/* The actual file input is hidden from view. Clicking the button triggers it. */}
                    <input type="file" hidden multiple onChange={onFileChange} />
                </Button>
                
                {/* This section provides visual feedback, showing the names of the files the user has selected. */}
                {attachedFiles.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Typography variant="caption" sx={{ width: '100%' }}>Attachments:</Typography>
                        {/* Map over the array of attached files and render a Chip for each one. */}
                        {attachedFiles.map((file, index) => (
                            <Chip key={index} label={file.name} size="small" />
                        ))}
                    </Box>
                )}
            </Stack>
        </Stack>
    );
}