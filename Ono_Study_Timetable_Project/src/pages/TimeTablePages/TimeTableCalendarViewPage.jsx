// /src/pages/TimeTablePages/TimeTableCalendarViewPage.jsx

import React, { useState } from "react";
import { Button, Stack, CircularProgress, Typography, Box } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView.jsx";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal.jsx";
import { useEvents } from "../../context/EventsContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
// ✅ ייבוא הפונקציות מה-handler
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers.js"; // ודא נתיב

export default function TimeTableCalendarViewPage() {
  const { studentEvents, isLoadingEvents, refreshStudentEvents } = useEvents();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [modalError, setModalError] = useState("");
  // ✅ State נוסף לניהול שגיאות אימות מה-handler
  const [validationErrors, setValidationErrors] = useState({});

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setDefaultDate(null);
    setModalError("");
    setValidationErrors({}); // נקה גם שגיאות אימות
  };

  const handleDateClick = (info) => {
    console.log("Date clicked:", info.dateStr);
    if (!currentUser) {
        alert("Please log in to add personal events.");
        return;
    }
    setSelectedEvent(null);
    setDefaultDate(info.dateStr || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
};

const handleEventClick = (info) => {
  console.log("Event clicked:", info.event);
  const clickedEvent = info.event;
  // Access data from extendedProps where we stored the raw event details
  const props = clickedEvent.extendedProps || {};
  const eventType = props.type;
  const eventStudentId = props.studentId; // Check studentId from extendedProps
  const eventCode = props.eventCode || clickedEvent.id; // Get the unique ID

  // Only allow editing if it's a 'studentEvent' AND belongs to the current user
  if (eventType === 'studentEvent' && eventStudentId && currentUser && eventStudentId === currentUser.id) {
      console.log(`Opening edit modal for own personal event: ${eventCode}`);

      // ✅ Extract data from extendedProps and map to modal's expected format
      const eventForModal = {
          eventCode: eventCode, // Pass the ID
          eventName: props.eventName || clickedEvent.title || '', // Use prop, fallback to title
          notes: props.notes || '',
          date: props.startDate || clickedEvent.startStr?.split('T')[0] || '', // Use prop, fallback to FC date string
          allDay: props.allDay || clickedEvent.allDay || false,
          startTime: props.allDay ? '' : (props.startHour || ''), // Use startHour from props
          endTime: props.allDay ? '' : (props.endHour || ''),     // Use endHour from props
      };

      console.log("Data prepared for modal:", eventForModal);

      setSelectedEvent(eventForModal); // Set the data for the modal
      setDefaultDate(null);          // Clear default date (not needed for edit)
      setModalError("");             // Clear previous errors
      setValidationErrors({});       // Clear previous validation errors
      setIsModalOpen(true);          // Open the modal
  } else {
      console.log(`Event clicked is not an editable personal event (Type: ${eventType}, Owner: ${eventStudentId}, Current User: ${currentUser?.id})`);
      // Optional: Show a read-only view or just do nothing
      alert(`Event Details:\nTitle: ${clickedEvent.title}\nType: ${eventType}\nStart: ${clickedEvent.start?.toLocaleString()}`);
  }
};

  // ✅ מימוש שמירה (הוספה/עדכון) - *שימוש ב-Handler*
  const handleSave = async (formData) => { // formData has { eventCode, eventName, notes, date, allDay, startTime, endTime }
    console.log("Modal submitted data:", formData);
    setModalError("");
    setValidationErrors({});
    if (!currentUser || !currentUser.id) { /* ... error handling ... */ return; }
  
    const actionType = selectedEvent ? "edit" : "add";
  
    // --- ✅ START Data Mapping ---
    // Map modal field names to storage field names
    const eventDataForStorage = {
        eventCode: formData.eventCode || `sevt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, // Ensure unique ID for add
        eventName: formData.eventName,
        notes: formData.notes,
        startDate: formData.date, // Map date -> startDate
        endDate: formData.date,   // For non-all-day, endDate is same as startDate
        allDay: formData.allDay,
        startHour: formData.allDay ? null : formData.startTime, // Map startTime -> startHour (null if allDay)
        endHour: formData.allDay ? null : formData.endTime,     // Map endTime -> endHour (null if allDay)
        studentId: currentUser.id, // Add the student ID
        // Make sure eventCode is present for updates
        ...(actionType === 'edit' && { eventCode: formData.eventCode }),
    };
     // If it's an all-day event spanning multiple days (not currently supported by modal, but for future proofing)
    // you might need separate startDate and endDate fields in the modal.
    // For now, assume single-day or timed events based on modal structure.
  
    // Use eventCode consistently as the ID field for the handler's update/delete logic
    eventDataForStorage.id = eventDataForStorage.eventCode;
    // --- ✅ END Data Mapping ---
  
    console.log("Mapped data being sent to handler:", eventDataForStorage);
  
    try {
      // Pass the *mapped* data to the handler
      const result = await handleSaveOrUpdateRecord("studentEvents", eventDataForStorage, actionType);
  
      if (result.success) {
        console.log("Handler Save/Update successful!");
        handleCloseModal();
        // ⚠️ IMPORTANT: We need a way to refresh the events from EventsContext!
        // Let's assume refreshStudentEvents exists in EventsContext (we'll add it later if needed)
        if (typeof refreshStudentEvents === 'function') {
           refreshStudentEvents(); // Call the refresh function
        } else {
           console.warn("refreshStudentEvents function not available in EventsContext. Calendar may not update automatically.");
           alert("Event saved, but you might need to refresh the page to see changes."); // Temporary feedback
        }
      } else {
        if (result.errors) {
            console.warn("Validation errors:", result.errors);
            setValidationErrors(result.errors);
            setModalError("Please correct the validation errors.");
        } else {
            console.error("Handler Save/Update failed:", result.message);
            setModalError(result.message || "Failed to save the event.");
        }
      }
    } catch (error) {
       console.error("Error calling handleSaveOrUpdateRecord:", error);
       setModalError(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
    }
  };

 // ✅ מימוש מחיקה - *שימוש ב-Handler*
 const handleDelete = (eventCodeToDelete) => {
     console.log("Attempting to delete event via handler, code:", eventCodeToDelete);
     if (!eventCodeToDelete) { /* ... */ return; }
     if (!window.confirm(`Are you sure you want to delete this event?`)) { return; }

     setModalError("");
     setValidationErrors({}); // נקה שגיאות

     // ✅ קריאה ל-handler עם callbacks
     handleDeleteEntityFormSubmit(
        "studentEvents",    // סוג הישות
        eventCodeToDelete,  // הערך של המפתח המזהה (eventCode)
        (successMessage) => { // onSuccess callback
            console.log("Handler Delete successful:", successMessage);
            handleCloseModal();
            refreshStudentEvents();
            alert(successMessage || "Event deleted successfully!");
        },
        (errorMessage) => { // onError callback
            console.error("Handler Delete failed:", errorMessage);
            setModalError(errorMessage || "Failed to delete the event.");
            // השאר את המודאל פתוח כדי שהמשתמש יראה את השגיאה
        }
     );
 };


  // --- Rendering Logic ---
  if (isLoadingEvents) {
    // Return loading spinner component here
    return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Calendar...</Typography>
       </Box>
    );
 }


 return (
   <Box sx={{ padding: "2rem" }}>
     {/* ✅ שימוש ב-Stack עם הגדרות Flexbox לשורה */}
     <Stack
       direction="row" // סדר פריטים בשורה
       justifyContent="space-between" // רווח מקסימלי בין הפריטים (כותרת בצד אחד, כפתור בצד שני)
       alignItems="center" // מרכז פריטים אנכית
       mb={2} // מרווח תחתון לפני לוח השנה
     >
       {/* הכותרת */}
       <Typography variant="h4" component="h1" gutterBottom={false}> {/* השתמש ב-h1 סמנטי */}
         My Timetable
       </Typography>

       {/* כפתור הוספה - יוצג רק אם מחובר */}
       {currentUser && (
           <Button
             variant="contained"
             color="primary"
             onClick={() => {
               setSelectedEvent(null);
               setDefaultDate(new Date().toISOString().split('T')[0]);
               setIsModalOpen(true);
             }}
             startIcon={<span>➕</span>}
             // ✅ אופציונלי: הגדר רוחב מינימלי/מקסימלי אם רוצים למנוע גלישה במסכים קטנים
             // sx={{ whiteSpace: 'nowrap' }}
           >
             Add Personal Event
           </Button>
       )}
     </Stack> {/* סוף ה-Stack העליון */}

     {/* לוח השנה */}
     <FullCalendarView
       key={studentEvents.length}
       events={studentEvents}
       onDateClick={handleDateClick}
       onEventClick={handleEventClick}
     />

     {/* המודאל (ללא שינוי) */}
     {isModalOpen && (
       <StudentPersonalEventFormModal
         open={isModalOpen}
         onClose={handleCloseModal}
         onSave={handleSave}
         onDelete={handleDelete}
         initialData={selectedEvent}
         defaultDate={defaultDate}
         errorMessage={modalError}
         validationErrors={validationErrors}
       />
     )}
   </Box>
 );
}