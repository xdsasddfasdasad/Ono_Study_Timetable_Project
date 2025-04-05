import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout
import AppLayout from "../layouts/AppLayout";

// Pages
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import HelpPage from "../pages/HelpPage";
import StudentManagementPage from "../pages/StudentManagementPage";
import SystemInfoDashboardPage from "../pages/SystemInfoDashboardPage";

// TimeTable Pages
import TimeTableCalendarViewPage from "../pages/TimeTablePages/TimeTableCalendarViewPage";
import TimeTableListViewPage from "../pages/TimeTablePages/TimeTableListViewPage";
import TimeTableManagementPage from "../pages/TimeTablePages/TimeTableManagementPage";

// 404 fallback
const NotFoundPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1>404 - Page Not Found</h1>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ברירת מחדל: הפניה לדף התחברות */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* דפים שלא משתמשים ב-Layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* דפים עם Layout קבוע (AppBar) */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/students" element={<StudentManagementPage />} />
          <Route path="/dashboard" element={<SystemInfoDashboardPage />} />
          <Route path="/schedule/calendar" element={<TimeTableCalendarViewPage />} />
          <Route path="/schedule/list" element={<TimeTableListViewPage />} />
          <Route path="/schedule/management" element={<TimeTableManagementPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
