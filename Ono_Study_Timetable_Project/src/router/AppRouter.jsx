// src/router/AppRouter.jsx

import React from "react";
// Imports the necessary components from the `react-router-dom` library for client-side routing.
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// Imports the main application layout and the login page.
import AppLayout from "../layouts/AppLayout.jsx";
import LoginPage from "../pages/LoginPage.jsx";
// Imports the component that protects routes from unauthenticated access.
import ProtectedRoute from "../components/Auth/ProtectedRoute.jsx";

// Import all page components that will be assigned to a route.
import HomePage from "../pages/HomePage.jsx";
import HelpPage from "../pages/HelpPage.jsx";
import StudentManagementPage from "../pages/StudentManagementPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import TimeTableCalendarViewPage from "../pages/TimeTablePages/TimeTableCalendarViewPage.jsx";
import TimeTableListViewPage from "../pages/TimeTablePages/TimeTableListViewPage.jsx";
import TimeTableManagementPage from "../pages/TimeTablePages/TimeTableManagementPage.jsx";
import MessagesPage from "../pages/MessagesPage.jsx";

// Import the new page for page-based entity management.
import EntityActionPage from '../pages/management/EntityActionPage.jsx';

// A simple, stateless component to be displayed for any routes that are not found.
const NotFoundPage = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist or you do not have permission to view it.</p>
  </div>
);

// This is the main router component for the entire application.
// It uses a declarative approach to define the relationship between URLs and the components that should render.
export default function AppRouter() {
  return (
    // `BrowserRouter` is the top-level component that enables client-side routing using the browser's history API.
    <BrowserRouter>
      {/* `Routes` is a container for a collection of individual `Route` definitions. */}
      <Routes>
        {/* --- Public Route --- */}
        {/* This route is not nested inside the ProtectedRoute, so it is accessible to anyone. */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* --- Protected Routes Wrapper --- */}
        {/* This is a powerful pattern. This `Route` has no `path`, so it acts as a layout and protection wrapper.
            - `ProtectedRoute` first checks if the user is authenticated. If not, it redirects to "/login".
            - If the user *is* authenticated, it renders its child, which is the `AppLayout`.
            - The `AppLayout` component contains the shared UI (Header, Footer) and an `<Outlet />`.
            - All the nested routes below will be rendered inside that `<Outlet />`.
        */}
        <Route
           element={
               <ProtectedRoute>
                   <AppLayout />
               </ProtectedRoute>
           }
        >
            {/* The `index` route defines the default component to render at the parent's root path ("/").
                Here, we immediately navigate to the dashboard for a better user experience. */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Main Application Pages */}
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/help" element={<HelpPage />} />
            
            {/* Student-facing Timetable Routes */}
            <Route path="/timetable/calendar" element={<TimeTableCalendarViewPage />} />
            <Route path="/timetable/list" element={<TimeTableListViewPage />} />
            
            {/* Administrator Management Routes */}
            <Route path="/manage-students" element={<StudentManagementPage />} />
            <Route path="/manage-timetable" element={<TimeTableManagementPage />} />
            
            {/* This is the new dynamic route for the page-based management forms.
                - `:entityType`, `:mode`, and `:entityId` are URL parameters.
                - For example, a URL like "/management/lecturer/edit/L01" will be matched by this route.
                - The `EntityActionPage` component will then use the `useParams` hook to get these values.
                - The `?` makes the `entityId` parameter optional, which is necessary for the "new" mode.
            */}
            <Route 
              path="/management/:entityType/:mode/:entityId?" 
              element={<EntityActionPage />} 
            />
            
        </Route> {/* End of the protected route wrapper */}
        
        {/* --- Fallback / 404 Route --- */}
        {/* `path="*"` is a wildcard that matches any URL that was not matched by the routes above.
            It must be the last route defined to function correctly as a catch-all. */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}