import React, { useEffect, useState } from "react";
import BigCalendar from "../components/calendar/BigCalendar";
import StudentPersonalEventFormModal from "../components/modals/StudentPersonalEventFormModal";

export default function TimeTableCalendarViewPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  // Load and normalize all event types
  useEffect(() => {
    const load = (key, eventType) =>
      (JSON.parse(localStorage.getItem(key)) || []).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        eventType,
      }));

    const allEvents = [
      ...load("studentEvents", "personal"),
      ...load("onlineClasses", "onlineClass"),
      ...load("events", "event"),
      ...load("holidays", "holiday"),
      ...load("vacations", "vacation"),
    ];

    setEvents(allEvents);
  }, []);

  const saveToStorage = (updated) => {
    setEvents(updated);
    const personal = updated.filter((e) => e.eventType === "personal");
    localStorage.setItem("studentEvents", JSON.stringify(personal));
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedEvent(null);
    setDefaultDate(start);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    if (event.eventType === "personal") {
      setSelectedEvent(event);
      setIsModalOpen(true);
    } else {
      alert(`Viewing: ${event.title}\n(${event.eventType})`);
    }
  };

  const handleSaveEvent = (formData) => {
    const newEvent = {
      ...formData,
      start: new Date(`${formData.date}T${formData.startTime}`),
      end: new Date(`${formData.date}T${formData.endTime}`),
      eventType: "personal",
    };

    const updated = selectedEvent
      ? events.map((evt) => (evt === selectedEvent ? newEvent : evt))
      : [...events, newEvent];

    saveToStorage(updated);
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (eventToDelete) => {
    const updated = events.filter((e) => e !== eventToDelete);
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
