// src/App.jsx

import React from 'react';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";
import { EventsProvider } from "./context/EventsContext";
import AppRouter from "./router/AppRouter";
import { AgentProvider } from './context/AgentContext';
import {AppDataProvider} from './context/AppDataContext'
// --- STEP 6: Import the new global agent components ---
import FloatingAgentButton from './components/agent/FloatingAgentButton';
import AgentModal from './components/agent/AgentModal';
import AIFunctionHandler from './components/agent/AIFunctionHandler';

function App() {
  console.log("App component rendering...");
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventsProvider> {/* EventsProvider first is fine */}
          <AppDataProvider>
            <AgentProvider> {/* AgentProvider wraps the components that need it */}
              
              {/* Your main application router */}
              <AppRouter/>
              
              {/* --- STEP 6: Add the global agent components here --- */}
              {/* These components will now be rendered on top of any page */}
              {/* They will not affect your page layout as they are 'fixed' or modal */}
              
              {/* 1. The button that is always visible to open the agent */}
              <FloatingAgentButton />
              
              {/* 2. The modal itself, which is hidden until isAgentOpen becomes true */}
              <AgentModal />
              
              {/* 3. The non-visual component that listens and executes AI function calls */}
              <AIFunctionHandler />

            </AgentProvider>
          </AppDataProvider>
        </EventsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;