// src/App.jsx
import React from 'react';
import AppRouter from "./router/AppRouter";
import { AuthProvider } from './context/AuthContext.jsx';
import { EventsProvider } from './context/EventsContext.jsx';

function App() {
  console.log("Rendering App component (with Providers and Router)");
  return (
    <AuthProvider>
      <EventsProvider>
        <AppRouter />
      </EventsProvider>
    </AuthProvider>
  );
}

export default App;