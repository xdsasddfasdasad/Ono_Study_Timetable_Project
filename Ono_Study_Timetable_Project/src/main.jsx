// src/main.jsx
import React, { useState, useEffect } from 'react'; // Add useState, useEffect
import ReactDOM from 'react-dom/client';
import App from './App'; // Keep importing App component
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
// Import seeding functions
import { seedBaseData } from "./utils/seedBaseData";
import { seedEventsData } from "./utils/seedEventsData";

// Component to handle initial loading and seeding
function AppLoader() {
  const [isSeedingComplete, setIsSeedingComplete] = useState(false);
  const [seedingError, setSeedingError] = useState(null);

  useEffect(() => {
    const performSeeding = async () => {
      console.log("[AppLoader] Starting initial check and seeding...");
      try {
        // Check if seeding is potentially needed (can be more sophisticated)
        const needsSeed = !localStorage.getItem("students") || !localStorage.getItem("coursesMeetings"); // Check essential keys

        if (needsSeed) {
          console.log("[AppLoader] Seeding required, running seed functions...");
          // Run base data seeding first
          await seedBaseData(true); // Use force=true for initial guaranteed seed
          console.log("[AppLoader] seedBaseData finished.");
          // Then run event data seeding
          await seedEventsData(true); // Use force=true for initial guaranteed seed
          console.log("[AppLoader] seedEventsData finished.");
          console.log("[AppLoader] Seeding potentially complete.");
        } else {
          console.log("[AppLoader] Essential data found in localStorage, skipping initial seed.");
        }
        // Mark seeding as complete (or skipped)
        setIsSeedingComplete(true);
      } catch (error) {
        console.error("[AppLoader] CRITICAL ERROR during seeding:", error);
        setSeedingError("Failed to initialize application data. Please try clearing storage and refreshing.");
        setIsSeedingComplete(true); // Mark as complete even on error to show error message
      }
    };

    // Run seeding only once on mount
    performSeeding();

  }, []); // Empty dependency array ensures it runs only once

  // --- Render based on seeding status ---
  if (seedingError) {
    // Display error if seeding failed critically
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {seedingError}</div>;
  }

  if (!isSeedingComplete) {
    // Display loading indicator while seeding is in progress
    // Maybe add a more prominent loading screen here
    return <div>Initializing Application Data... Please wait.</div>;
  }

  // If seeding is complete (or skipped), render the main App component
  console.log("[AppLoader] Seeding complete/skipped, rendering App...");
  return <App />;

} // End of AppLoader component


// Render the AppLoader component instead of App directly
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Render AppLoader which will handle seeding then render App */}
      <AppLoader />
    </ThemeProvider>
  </React.StrictMode>
);