import React, { useEffect, useState } from "react";
import BigCalendar from "../../components/calendar/BigCalendar";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  // 🔄 Load all types of events
  useEffect(() => {
    const studentEvents = JSON.parse(localStorage.getItem("studentEvents") || "[]");
    const generalEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const holidays = JSON.parse(localStorage.getItem("holidays") || "[]");
    const vacations = JSON.parse(localStorage.getItem("vacations") || "[]");

    const all = [
      ...studentEvents.map((e) => ({ ...e, title: e.title, type: "student" })),
      ...generalEvents.map((e) => ({
        ...e,
        title: e.eventName,
        type: "event",
        start: new Date(`${e.startDate}T08:00`),
        end: new Date(`${e.endDate}T16:00`),
      })),
      ...holidays.map((h) => ({
        ...h,
        title: h.holidayName,
        type: "holiday",
        start: new Date(`${h.date}T00:00`),
        end: new Date(`${h.date}T23:59`),
      })),
      ...vacations.map((v) => ({
        ...v,
        title: v.vacationName,
        type: "vacation",
        start: new Date(`${v.startDate}T00:00`),
        end: new Date(`${v.endDate}T23:59`),
      })),
    ];

    setEvents(all);
    console.log("Loaded events from localStorage:", parsed);
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
