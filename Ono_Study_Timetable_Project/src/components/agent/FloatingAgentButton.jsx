// src/components/agent/FloatingAgentButton.jsx

import React from 'react';
// Imports Material-UI components for building the UI.
// Fab is the Floating Action Button itself.
import { Fab, Tooltip } from '@mui/material';
// The robot icon displayed inside the button.
import SmartToyIcon from '@mui/icons-material/SmartToy';

// This component renders the floating button used to open the AI Assistant.
// It receives its state and behavior via props from its parent component.
// It's designed to be visually present when the assistant is closed and to
// hide with a smooth animation when the assistant is open.
// - 'onClick': A function to be called when the button is clicked.
// - 'isOpen': A boolean that determines the button's visibility.
export default function FloatingAgentButton({ onClick, isOpen }) {
  return (
    // The Tooltip component provides a helpful text label when a user hovers over the button.
    <Tooltip title="Open AI Assistant">
      {/* The Fab (Floating Action Button) is the main, circular button element. */}
      <Fab
        color="primary"
        aria-label="open ai assistant"
        onClick={onClick}
        // The 'sx' prop is used for applying custom styles directly to the component.
        sx={{
          // Positions the button relative to the viewport, so it stays in place when scrolling.
          position: 'fixed',
          bottom: 24,
          right: 24,
          // Sets the stack order. A high z-index ensures the button appears above other page content.
          // This value is chosen to be just below the AI console itself.
          zIndex: 1350,
          // Defines a smooth transition for the 'transform' property, creating the hide/show animation.
          transition: 'transform 0.3s ease-in-out',
          // Controls the visibility of the button.
          // If 'isOpen' is true (meaning the AI console is open), the button scales to 0 (disappears).
          // If 'isOpen' is false, it scales to 1 (normal size).
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
      >
        <SmartToyIcon />
      </Fab>
    </Tooltip>
  );
}