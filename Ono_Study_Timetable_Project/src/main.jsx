// src/main.jsx
import React, { useState, useEffect } from 'react'; 
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import './index.css'
import { seedBaseData } from "./utils/seedBaseData";
import { seedEventsData } from "./utils/seedEventsData";
function AppLoader() {
  const [isSeedingComplete, setIsSeedingComplete] = useState(false);
  const [seedingError, setSeedingError] = useState(null);

  useEffect(() => {
    const performSeeding = async () => {
      console.log("[AppLoader] Starting initial check and seeding...");
      try {
        const needsSeed = !localStorage.getItem("students") || !localStorage.getItem("coursesMeetings");
        if (needsSeed) {
          console.log("[AppLoader] Seeding required, running seed functions...");
          await seedBaseData(true);
          console.log("[AppLoader] seedBaseData finished.");
          await seedEventsData(true);
          console.log("[AppLoader] seedEventsData finished.");
          console.log("[AppLoader] Seeding potentially complete.");
        } else {
          console.log("[AppLoader] Essential data found in localStorage, skipping initial seed.");
        }
        setIsSeedingComplete(true);
      } catch (error) {
        console.error("[AppLoader] CRITICAL ERROR during seeding:", error);
        setSeedingError("Failed to initialize application data. Please try clearing storage and refreshing.");
        setIsSeedingComplete(true);
      }
    };
    performSeeding();
  }, []);
  if (seedingError) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {seedingError}</div>;
  }
  if (!isSeedingComplete) {
    return <div>Initializing Application Data... Please wait.</div>;
  }
  console.log("[AppLoader] Seeding complete/skipped, rendering App...");
  return <App />;
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppLoader />
    </ThemeProvider>
  </React.StrictMode>
);