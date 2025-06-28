import React, { useState, useRef } from 'react';
import { Stack, TextField, Button, IconButton, Box, Chip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';

const MessageComposer = ({ onSend, disabled = false }) => {
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState(null); // To hold the selected file object
    const fileInputRef = useRef(null); // To trigger file input click

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Optional: Add validation for file size or type here
            setAttachment(file);
        }
    };

    const handleRemoveAttachment = () => {
        setAttachment(null);
        if(fileInputRef.current) {
            // This is important to allow selecting the same file again
            fileInputRef.current.value = ""; 
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Prevent sending if both text and attachment are empty
        if (!text.trim() && !attachment) return;
        
        // Pass both text and file object to the parent component
        onSend(text, attachment); 
        
        // Reset state after sending
        setText('');
        handleRemoveAttachment();
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={1}>
                <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Type your message..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={disabled}
                    multiline
                    maxRows={4}
                />
                {attachment && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                        <Chip
                            icon={<AttachFileIcon />}
                            label={attachment.name}
                            onDelete={handleRemoveAttachment}
                            deleteIcon={<ClearIcon />}
                            sx={{ maxWidth: '100%' }}
                            color="info"
                        />
                    </Box>
                )}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <IconButton onClick={() => fileInputRef.current?.click()} disabled={disabled}>
                        <AttachFileIcon />
                    </IconButton>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button type="submit" variant="contained" disabled={disabled || (!text.trim() && !attachment)}>
                        Send
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default MessageComposer;