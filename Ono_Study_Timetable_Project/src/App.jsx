// src/App.jsx
import AppRouter from "./router/AppRouter";
import { seedBaseData } from "./utils/seedBaseData";
import { seedEventsData } from "./utils/seedEventsData";
import { getStudentEvents } from "./utils/getStudentEvents";

// Simulate current logged-in student
const currentStudentId = "stud1"; // 🔥 you can later change it dynamically

// Load only this student's events
const studentEvents = getStudentEvents(currentStudentId);

if (process.env.NODE_ENV === "development") {
  seedBaseData();
  seedEventsData();

  window.seedBase = () => seedBaseData(true);
  window.seedEvents = () => seedEventsData(true);
}

function App() {
  return <AppRouter />;
}

export default App;
