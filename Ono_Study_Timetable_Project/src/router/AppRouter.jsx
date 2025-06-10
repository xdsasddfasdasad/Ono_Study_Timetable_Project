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
import MessagesPage from "../pages/MessagesPage.jsx"; // --- 1. IMPORT THE NEW PAGE ---
import ProtectedRoute from "../components/Auth/ProtectedRoute.jsx";

const NotFoundPage = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
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
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/help" element={<HelpPage />} />
            
            {/* Timetable Routes */}
            <Route path="/timetable/calendar" element={<TimeTableCalendarViewPage />} />
            <Route path="/timetable/list" element={<TimeTableListViewPage />} />
            
            {/* Management Routes */}
            <Route path="/manage-students" element={<StudentManagementPage />} />
            <Route path="/manage-timetable" element={<TimeTableManagementPage />} />
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}