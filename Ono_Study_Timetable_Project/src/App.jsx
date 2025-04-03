// src/App.jsx
import AppRouter from "./router/AppRouter";
// future: import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    // <AuthProvider>  // נוסיף כשיהיה ניהול הרשאות
    <AppRouter />
    // </AuthProvider>
  );
}

export default App;
