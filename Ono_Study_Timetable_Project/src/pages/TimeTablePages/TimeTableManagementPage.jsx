import React, { useEffect, useState } from "react";
import BigCalendar from "../components/calendar/BigCalendar";
import TimeTableCalendarManageModal from "../components/modals/TimeTableCalendarManageModal";

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  // Load all events on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("allEvents")) || [];
    const parsed = stored.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setEvents(parsed);
  }, []);

  const saveToStorage = (updatedEvents) => {
    setEvents(updatedEvents);
    localStorage.setItem("allEvents", JSON.stringify(updatedEvents));
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent(null);
    setDefaultDate(start);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (formData) => {
    const newEvent = {
      ...formData,
      start: new Date(`${formData.date}T${formData.startTime}`),
      end: new Date(`${formData.date}T${formData.endTime}`),
    };

    const updated = selectedEvent
      ? events.map((evt) => (evt === selectedEvent ? newEvent : evt))
      : [...events, newEvent];

    saveToStorage(updated);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (eventToDelete) => {
    const updated = events.filter((evt) => evt !== eventToDelete);
    saveToStorage(updated);
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <BigCalendar
        events={events}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
      />

      <TimeTableCalendarManageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        defaultDate={defaultDate}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
