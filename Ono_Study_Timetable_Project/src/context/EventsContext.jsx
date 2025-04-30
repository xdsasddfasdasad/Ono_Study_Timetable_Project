// src/context/EventsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// ודא שהנתיב ל-getStudentEvents ו-useAuth נכון
import { getStudentEvents } from '../utils/getStudentEvents';
import { useAuth } from './AuthContext';

const EventsContext = createContext(null);

export const EventsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [studentEvents, setStudentEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    // נקה אירועים קודמים והגדר טעינה כשהמשתמש משתנה או מתנתק
    setStudentEvents([]);
    setIsLoadingEvents(true);

    if (currentUser && currentUser.id) {
      console.log(`EventsContext: טוען אירועים עבור סטודנט ID: ${currentUser.id}`);
      try {
          // קריאה לפונקציה לקבלת אירועים מסוננים למשתמש הנוכחי
          const filteredEvents = getStudentEvents(currentUser.id);
          setStudentEvents(filteredEvents);
          console.log(`EventsContext: נטענו ${filteredEvents.length} אירועים.`);
      } catch (error) {
          console.error("שגיאה בטעינה או עיבוד אירועי סטודנט:", error);
          // השאר את מערך האירועים ריק במקרה של שגיאה
      } finally {
          // תמיד הסר את מצב הטעינה בסיום
          setIsLoadingEvents(false);
      }

    } else {
      // אין משתמש מחובר, ודא שהאירועים ריקים ומצב הטעינה שקרי
      setIsLoadingEvents(false);
      console.log("EventsContext: אין משתמש מחובר, האירועים נוקו.");
    }
    // הרץ אפקט זה מחדש אם currentUser משתנה (לוגין/לוגאאוט)
  }, [currentUser]);

  // הערך שיועבר לקומפוננטות שיצרכו את הקונטקסט
  const value = {
    studentEvents,
    isLoadingEvents,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}; // סיום הקומפוננטה EventsProvider

// Custom hook to use the events context
export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}; // סיום ה-hook useEvents