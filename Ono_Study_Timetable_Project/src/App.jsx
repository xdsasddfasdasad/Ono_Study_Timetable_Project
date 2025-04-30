// src/App.jsx
import React from 'react'; // Ensure React is imported
import AppRouter from "./router/AppRouter";
// No longer need seeding functions or getStudentEvents here
import { AuthProvider } from './context/AuthContext.jsx';
import { EventsProvider } from './context/EventsContext.jsx';

function App() {
  console.log("Rendering App component (with Providers and Router)");
  // Wrap the router with context providers
  return (
    <AuthProvider>
      <EventsProvider>
        <AppRouter />
      </EventsProvider>
    </AuthProvider>
  );
}

export default App;