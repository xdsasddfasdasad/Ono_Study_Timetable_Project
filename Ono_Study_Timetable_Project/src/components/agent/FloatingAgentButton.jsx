// src/components/agent/FloatingAgentButton.jsx

import React from 'react';
import { Fab, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// ✨ FIX: The button now gets its logic from props and hides when the console is open
export default function FloatingAgentButton({ onClick, isOpen }) {
  return (
    <Tooltip title="Open AI Assistant">
      <Fab
        color="primary"
        aria-label="open ai assistant"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1350, // Below the console, but above content
          // Smoothly transition out when the console is open
          transition: 'transform 0.3s ease-in-out',
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
      >
        <SmartToyIcon />
      </Fab>
    </Tooltip>
  );
}