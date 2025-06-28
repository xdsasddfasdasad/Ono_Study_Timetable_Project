// src/layouts/AppLayout.jsx

import React, { useState } from 'react';
import { Outlet } from "react-router-dom";
import { Box, Stack, Toolbar } from "@mui/material"; // ✨ FIX: Import Toolbar
import HeaderNavigationBar from "../components/Header/HeaderNavigationBar";
import Footer from "../components/Footer/Footer";
import AIAgentConsole from '../components/AIAgentConsole';
import FloatingAgentButton from '../components/agent/FloatingAgentButton';

export default function AppLayout() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  const toggleAgentConsole = () => {
    setIsAgentOpen(prev => !prev);
  };

  return (
    <Stack sx={{ minHeight: "100vh" }}>
      <HeaderNavigationBar />
      
      {/* ✨ FIX: Add a dummy Toolbar here to offset the content */}
      <Toolbar /> 
      
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}> {/* Optional: Add some padding */}
        <Outlet />
      </Box>
      <Footer />
      
      {/* AI Agent Components */}
      <AIAgentConsole
        isOpen={isAgentOpen}
        onClose={toggleAgentConsole}
      />
      
      <FloatingAgentButton
        onClick={toggleAgentConsole}
        isOpen={isAgentOpen}
      />
    </Stack>
  );
}