// /src/router/AppRouter.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";

// Pages
import LoginPage from "../pages/LoginPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import HelpPage from "../pages/HelpPage.jsx";
import StudentManagementPage from "../pages/StudentManagementPage.jsx";
import SystemInfoDashboardPage from "../pages/SystemInfoDashboardPage.jsx";

// TimeTable Pages
import TimeTableCalendarViewPage from "../pages/TimeTablePages/TimeTableCalendarViewPage.jsx";
import TimeTableListViewPage from "../pages/TimeTablePages/TimeTableListViewPage.jsx";
import TimeTableManagementPage from "../pages/TimeTablePages/TimeTableManagementPage.jsx";

import GenerateHashes from "../pages/DevTools/GenerateHashes.jsx";
// ❌ הסרנו את הייבוא של RequireAuthHandler
// ✅ ייבאנו את ProtectedRoute
import ProtectedRoute from "../components/Auth/ProtectedRoute.jsx"; // ודא נתיב נכון

const NotFoundPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1>404 - Page Not Found</h1>
  </div>
);

export default function AppRouter() {
  console.log("AppRouter rendering..."); // בדוק אם הרכיב הזה בכלל מרונדר
  return (
    <BrowserRouter>
      <Routes>
        {/* --- נתיבים ציבוריים (לא דורשים אימות) --- */}
        <Route path="/login" element={<LoginPage />} />
        {/* אולי תוסיף כאן נתיב הרשמה בעתיד? */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}


        {/* --- נתיבים מוגנים (דורשים אימות) --- */}
        {/* השתמש ב-ProtectedRoute כאלמנט של Route אב */}
        <Route element={
            <ProtectedRoute>
              <AppLayout /> {/* AppLayout עוטף רק את הדפים המוגנים */}
            </ProtectedRoute>
          }>
            {/* כל הנתיבים שיוגדרו כאן יהיו מוגנים ויקבלו את ה-AppLayout */}
            {/* נתיב הבסיס '/' יטופל כאן: אם מחובר, יפנה ל-home (או מה שתגדיר כברירת מחדל) */}
            <Route index element={<Navigate to="/home" replace />} /> {/* אם הגעת ל'/' ואתה מחובר, עבור ל'/home' */}
            {/* אפשר גם להגדיר ש'/' יציג את HomePage ישירות: <Route index element={<HomePage />} /> */}

            <Route path="/home" element={<HomePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/students" element={<StudentManagementPage />} />
            <Route path="/dashboard" element={<SystemInfoDashboardPage />} />
            <Route path="/timetable/calendar" element={<TimeTableCalendarViewPage />} />
            <Route path="/timetable/list" element={<TimeTableListViewPage />} />
            <Route path="/timetable/management" element={<TimeTableManagementPage />} />

            {/* נתיב לכלי הפיתוח - גם הוא מוגן כעת */}
            <Route path="/generate-hashes" element={<GenerateHashes />} />
        </Route>


        {/* --- דף 404 - אם אף נתיב לא תואם --- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}