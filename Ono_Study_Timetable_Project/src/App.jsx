// src/App.jsx

import React from 'react';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme"; // Assuming you have a theme file
import { AuthProvider } from "./context/AuthContext";
import { EventsProvider } from "./context/EventsContext";
import AppRouter from "./router/AppRouter";
// Optional: Seeding logic (less recommended here)
// import { seedIfNeeded } from './utils/seedFirestoreIfNeeded'; // Example function

function App() {
  console.log("App component rendering...");

  // Optional: Run seeding check once on app startup
  // useEffect(() => {
  //   seedIfNeeded(); // Implement this function carefully
  // }, []);

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