// src/components/forms/NewMessageForm.jsx

import React from 'react';
import { Stack, FormControl, InputLabel, Select, MenuItem, TextField, Button, Box, Typography, Chip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';

/**
 * A "dumb" presentational component for the new message form.
 * It receives all its data and handlers as props.
 */
export default function NewMessageForm({
    formData,
    onFormChange,
    onFileChange,
    lecturers = [],
    attachedFiles = [],
    disabled = false
}) {
  return (
    <Stack spacing={3} sx={{ pt: 1 }}>
      {/* Recipient Dropdown */}
      <FormControl fullWidth required disabled={disabled}>
        <InputLabel id="recipient-lecturer-label">To</InputLabel>
        <Select
          labelId="recipient-lecturer-label"
          name="recipient" // Let's use a clear name
          value={formData.recipient || ''}
          label="To"
          onChange={onFormChange}
        >
          <MenuItem value="" disabled><em>Select a lecturer...</em></MenuItem>
          {lecturers.map((lecturer) => (
            <MenuItem key={lecturer.id} value={lecturer.id}>
              {/* Assuming lecturer object has `name` or `firstName`/`lastName` */}
              {lecturer.name || `${lecturer.firstName} ${lecturer.lastName}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Message Body Field */}
      <TextField
        fullWidth
        required
        multiline
        rows={8}
        name="body" // Use a clear name
        label="Message"
        value={formData.body || ''}
        onChange={onFormChange}
        disabled={disabled}
      />

      {/* File Attachment Section */}
      <Stack spacing={1}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<AttachFileIcon />}
          disabled={disabled}
        >
          Attach Files
          <input type="file" hidden multiple onChange={onFileChange} />
        </Button>
        {attachedFiles.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Typography variant="caption" sx={{ width: '100%' }}>Attachments:</Typography>
              {attachedFiles.map((file, index) => (
                  <Chip key={index} label={file.name} size="small" />
              ))}
          </Box>
        )}
      </Stack>
    </Stack>
  );
}