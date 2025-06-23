// src/App.jsx

import React from 'react';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";

// ✨ FIX: Correct the import path for EventsProvider
import { EventsProvider } from "./context/EventsContext"; 
// The export 'EventsProvider' is inside the file 'EventsContext.jsx'

import AppRouter from "./router/AppRouter";
// The following line was removed as you indicated the provider doesn't exist
// import { AppDataProvider } from './context/AppDataContext'; 

function App() {
  console.log("App component rendering...");
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventsProvider>
          {/* Removed AppDataProvider as per your feedback */}
          <AppRouter />
        </EventsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;