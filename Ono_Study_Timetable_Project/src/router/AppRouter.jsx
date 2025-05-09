// src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import HelpPage from "../pages/HelpPage.jsx";
import StudentManagementPage from "../pages/StudentManagementPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import TimeTableCalendarViewPage from "../pages/TimeTablePages/TimeTableCalendarViewPage.jsx";
import TimeTableListViewPage from "../pages/TimeTablePages/TimeTableListViewPage.jsx";
import TimeTableManagementPage from "../pages/TimeTablePages/TimeTableManagementPage.jsx";
import ProtectedRoute from "../components/Auth/ProtectedRoute.jsx"; // Import the correct component

const NotFoundPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1>404 - Page Not Found</h1>
  </div>
);
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
           element={
               <ProtectedRoute>
                   <AppLayout />
               </ProtectedRoute>
           }
        >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/students" element={<StudentManagementPage />} />
            <Route path="/timetable/calendar" element={<TimeTableCalendarViewPage />} />
            <Route path="/timetable/list" element={<TimeTableListViewPage />} />
            <Route path="/timetable/management" element={<TimeTableManagementPage />} />
            {/* Add other protected routes here */}
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}