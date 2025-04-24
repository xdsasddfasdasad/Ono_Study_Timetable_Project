import React, { useEffect, useState } from "react";
import BigCalendar from "../components/calendar/BigCalendar";
import StudentPersonalEventFormModal from "../components/forms/StudentPersonalEventFormModal";

const STORAGE_KEY = "studentPersonalEvents";

export default function TimeTableCalendarViewPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const parsed = stored.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setEvents(parsed);
  }, []);

  // Save and update events
  const saveToStorage = (updatedEvents) => {
    setEvents(updatedEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEvents));
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent(null);
    setDefaultDate(start);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setDefaultDate(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = () => {
    // reload from storage after save/delete handled inside modal
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const parsed = stored.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setEvents(parsed);
    setIsModalOpen(false);
    setSelectedEvent(null);
    setDefaultDate(null);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <BigCalendar
        events={events}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
      />

      <StudentPersonalEventFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        defaultDate={defaultDate}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
