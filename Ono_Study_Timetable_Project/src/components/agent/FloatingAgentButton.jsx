// src/components/agent/FloatingAgentButton.jsx

import React from 'react';
import { Fab, Tooltip, Zoom } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { useAgent } from '../../context/AgentContext'; // Import the custom hook to access our global agent state

/**
 * A visually appealing Floating Action Button (FAB) that remains fixed on the screen.
 * Its sole purpose is to open the AI Agent modal by updating the global context.
 */
export default function FloatingAgentButton() {
    // 1. Consume the context.
    // We only need the `setIsAgentOpen` function from the context, so we destructure it.
    // This is efficient because this component will only re-render if `setIsAgentOpen` itself changes,
    // which it won't, making this component very lightweight.
    const { setIsAgentOpen } = useAgent();

    // 2. Define the click handler.
    // This function is called when the user clicks the button.
    const handleOpenAgent = () => {
        // It dispatches the state update to our global context, which will trigger the modal to open.
        setIsAgentOpen(true);
    };

    return (
        // 3. The JSX for rendering the button.
        // The Zoom component from MUI provides a nice "pop-in" animation, making the UX smoother.
        <Zoom in={true} style={{ transitionDelay: '500ms' }}>
            {/* The Tooltip improves accessibility and user experience by showing a helpful label on hover. */}
            <Tooltip title="AI Assistant" placement="left">
                <Fab 
                    color="primary" 
                    aria-label="open ai assistant"
                    onClick={handleOpenAgent}
                    // The 'sx' prop is used for applying styles directly.
                    // This is the modern way in MUI for component-specific styling.
                    sx={{
                        position: 'fixed', // This keeps the button in place during scrolling.
                        bottom: { xs: 24, md: 32 }, // Responsive padding for the bottom edge.
                        right: { xs: 24, md: 32 },  // Responsive padding for the right edge.
                        zIndex: 1301 // A high z-index ensures it floats above most other UI elements like calendars or navbars.
                    }}
                >
                    <SmartToyOutlinedIcon />
                </Fab>
            </Tooltip>
        </Zoom>
    );
}