// src/App.jsx
import React from 'react';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";
import { EventsProvider } from "./context/EventsContext";
import AppRouter from "./router/AppRouter";

function App() {
  console.log("App component rendering...");
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventsProvider>
          <AppRouter />
        </EventsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;