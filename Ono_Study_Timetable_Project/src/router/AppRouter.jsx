// src/router/AppRouter.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import ProtectedRoute from "../components/Auth/ProtectedRoute.jsx";

// Import All Pages
import HomePage from "../pages/HomePage.jsx";
import HelpPage from "../pages/HelpPage.jsx";
import StudentManagementPage from "../pages/StudentManagementPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import TimeTableCalendarViewPage from "../pages/TimeTablePages/TimeTableCalendarViewPage.jsx";
import TimeTableListViewPage from "../pages/TimeTablePages/TimeTableListViewPage.jsx";
import TimeTableManagementPage from "../pages/TimeTablePages/TimeTableManagementPage.jsx";
import MessagesPage from "../pages/MessagesPage.jsx";

// ✨ 1. ייבוא הדף החדש שיצרנו
import EntityActionPage from '../pages/management/EntityActionPage.jsx';

// קומפוננטה פשוטה לדף 404
const NotFoundPage = () => (
  <div style={{ padding: "2rem", textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist or you do not have permission to view it.</p>
  </div>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* נתיב ציבורי, לא דורש התחברות */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* --- נתיבים מאובטחים --- */}
        {/* כל מה שנמצא כאן בפנים יעבור דרך ProtectedRoute ויוצג בתוך AppLayout */}
        <Route
           element={
               <ProtectedRoute>
                   <AppLayout />
               </ProtectedRoute>
           }
        >
            {/* ניתוב ברירת מחדל אחרי התחברות */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* דפים ראשיים */}
            <Route path="/home" element={<HomePage />} /> {/* ודא אם דף זה עדיין בשימוש או שה-dashboard הוא דף הבית */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/help" element={<HelpPage />} />
            
            {/* נתיבי לוח זמנים (תצוגות לסטודנט) */}
            <Route path="/timetable/calendar" element={<TimeTableCalendarViewPage />} />
            <Route path="/timetable/list" element={<TimeTableListViewPage />} />
            
            {/* --- נתיבי ניהול (מאובטחים) --- */}
            <Route path="/manage-students" element={<StudentManagementPage />} />
            <Route path="/manage-timetable" element={<TimeTableManagementPage />} />
            
            {/* ✨ 2. הנתיב החדש ממוקם כאן, בתוך האבטחה! */}
            {/* הוא תופס יצירה (new) ועריכה (edit) עבור כל הישויות */}
            <Route 
              path="/management/:entityType/:mode/:entityId?" 
              element={<EntityActionPage />} 
            />
            
        </Route> {/* סוגר את ה-Route המאובטח */}
        
        {/* ✨ 3. נתיב ה-Fallback חייב להיות האחרון ביותר */}
        {/* הוא יתפוס כל נתיב אחר שלא תאם לשום דבר למעלה */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}