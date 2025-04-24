import React, { useState, useEffect } from "react";
import BigCalendar from "../../components/calendar/BigCalendar";
import StudentPersonalEventFormModal from "../../components/modals/StudentPersonalEventFormModal";

export default function TimeTableCalendarViewPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const all = JSON.parse(localStorage.getItem("studentEvents")) || [];

    const filtered = all
      .filter((e) => e.ownerId === user?.id)
      .map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      }));

    setEvents(filtered);
  }, []);

  const saveToStorage = (updatedEvents) => {
    setEvents(updatedEvents);
    localStorage.setItem("studentEvents", JSON.stringify(updatedEvents));
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
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    const newEvent = {
      ...formData,
      ownerId: user?.id,
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

      <StudentPersonalEventFormModal
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
