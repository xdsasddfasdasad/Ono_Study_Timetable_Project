// src/App.jsx

import React from 'react';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";
import { EventsProvider } from "./context/EventsContext";
import AppRouter from "./router/AppRouter";
import { AgentProvider } from './context/AgentContext';
import { AppDataProvider } from './context/AppDataContext';

// --- ייבוא הקומפוננטות הגלובליות של הסוכן ---
import FloatingAgentButton from './components/agent/FloatingAgentButton';
import AgentModal from './components/agent/AgentModal';

// שים לב: AIFunctionHandler לא מיובא כאן כלל, כי הוא לא קומפוננטה.
// הוא מיובא ונעשה בו שימוש אך ורק בתוך AgentModal.jsx.

function App() {
  console.log("App component rendering...");
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <EventsProvider>
          <AppDataProvider>
            {/* AgentProvider עוטף את כל האפליקציה כדי שהקונטקסט יהיה זמין לכל הקומפוננטות */}
            <AgentProvider>
              
              {/* הראוטר הראשי של האפליקציה שלך */}
              <AppRouter />
              
              {/* --- הוספת הקומפוננטות הגלובליות של הסוכן --- */}
              {/* קומפוננטות אלה ממוקמות כאן כדי שיוצגו מעל כל עמוד */}
              
              {/* 1. הכפתור שתמיד נראה ופותח את הסוכן */}
              <FloatingAgentButton />
              
              {/* 2. המודאל עצמו, שמוסתר עד שהמשתנה isAgentOpen הופך ל-true */}
              <AgentModal />
              
              {/* 
                3. הסרנו את <AIFunctionHandler /> מכאן.
                   זו לא קומפוננטה ויזואלית, אלא לוגיקה ש-AgentModal משתמש בה באופן פנימי.
                   השארת השורה הזאת כאן תגרום לשגיאה.
              */}

            </AgentProvider>
          </AppDataProvider>
        </EventsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;