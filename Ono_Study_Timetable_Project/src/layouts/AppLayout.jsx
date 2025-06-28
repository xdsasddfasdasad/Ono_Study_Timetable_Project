// src/layouts/AppLayout.jsx

import React, { useState } from 'react';
// `Outlet` is a special component from react-router-dom that acts as a placeholder.
// It renders the matched child route component for the current URL.
import { Outlet } from "react-router-dom";
// Imports Material-UI components for structuring the layout.
import { Box, Stack, Toolbar } from "@mui/material";
// Imports the main, shared UI components for the layout.
import HeaderNavigationBar from "../components/Header/HeaderNavigationBar";
import Footer from "../components/Footer/Footer";
// Imports the AI Agent UI components.
import AIAgentConsole from '../components/AIAgentConsole';
import FloatingAgentButton from '../components/agent/FloatingAgentButton';

// This component defines the main application layout for all authenticated pages.
// It ensures that every page has a consistent Header, Footer, and main content area.
// It also manages the state for the floating AI Agent console.
export default function AppLayout() {
  // State to manage the visibility of the AI Agent console.
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  // A single function to toggle the agent's visibility state.
  const toggleAgentConsole = () => {
    setIsAgentOpen(prev => !prev);
  };

  return (
    // The `Stack` component is used as the top-level container to arrange the
    // Header, main content, and Footer vertically. `minHeight: "100vh"` ensures
    // that the footer will be pushed to the bottom of the screen even on short pages.
    <Stack sx={{ minHeight: "100vh" }}>
      {/* The HeaderNavigationBar is a fixed component at the top of the page. */}
      <HeaderNavigationBar />
      
      {/* --- Layout Fix --- */}
      {/* The `HeaderNavigationBar` uses `position: "fixed"`, which removes it from the normal
          document flow. This "dummy" Toolbar component takes up the same vertical space as the
          real header, effectively pushing the main content down so it isn't hidden underneath the fixed header. */}
      <Toolbar /> 
      
      {/* The `main` content area. */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        {/* The `Outlet` is where the specific page component (e.g., Dashboard, Timetable) will be rendered by the router. */}
        <Outlet />
      </Box>
      
      {/* The shared Footer component. `mt: 'auto'` in its styles helps it stick to the bottom. */}
      <Footer />
      
      {/* --- AI Agent Components --- */}
      {/* These components are included at the top-level layout to ensure they are available on every page. */}
      
      {/* The AI console itself. It is conditionally rendered based on the `isOpen` state. */}
      <AIAgentConsole
        isOpen={isAgentOpen}
        onClose={toggleAgentConsole}
      />
      
      {/* The floating button that opens the AI console. */}
      <FloatingAgentButton
        onClick={toggleAgentConsole}
        isOpen={isAgentOpen} // The button uses this to know when to hide itself.
      />
    </Stack>
  );
}