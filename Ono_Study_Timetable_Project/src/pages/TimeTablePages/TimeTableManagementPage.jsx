import React, { useEffect, useState } from "react";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import { Button, Stack } from "@mui/material";

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const getColorByType = (type) => {
    switch (type) {
      case "year":
        return "#1976d2";
      case "semester":
        return "#388e3c";
      case "holiday":
        return "#d32f2f";
      case "vacation":
        return "#f9a825";
      case "student":
        return "#7b1fa2";
      default:
        return "#0288d1";
    }
  };

  const loadEvents = () => {
    const baseEvents = JSON.parse(localStorage.getItem("allEvents") || "[]");
    const years = JSON.parse(localStorage.getItem("years") || "[]");
    const semesters = JSON.parse(localStorage.getItem("semesters") || "[]");
  
    const yearEvents = years.flatMap((y) => [
      {
        id: `year-start-${y.yearCode}`,
        title: `Year ${y.yearNumber} Start`,
        type: "year",
        start: new Date(`${y.startDate}T00:00`),
        end: new Date(`${y.startDate}T23:59`),
        allDay: true,
        backgroundColor: getColorByType("year"),
        borderColor: getColorByType("year"),
      },
      {
        id: `year-end-${y.yearCode}`,
        title: `Year ${y.yearNumber} End`,
        type: "year",
        start: new Date(`${y.endDate}T00:00`),
        end: new Date(`${y.endDate}T23:59`),
        allDay: true,
        backgroundColor: getColorByType("year"),
        borderColor: getColorByType("year"),
      },
    ]);
  
    const semesterEvents = semesters.flatMap((s) => [
      {
        id: `semester-start-${s.semesterCode}`,
        title: `Semester ${s.semesterNumber} Start`,
        type: "semester",
        start: new Date(`${s.startDate}T00:00`),
        end: new Date(`${s.startDate}T23:59`),
        allDay: true,
        backgroundColor: getColorByType("semester"),
        borderColor: getColorByType("semester"),
      },
      {
        id: `semester-end-${s.semesterCode}`,
        title: `Semester ${s.semesterNumber} End`,
        type: "semester",
        start: new Date(`${s.endDate}T00:00`),
        end: new Date(`${s.endDate}T23:59`),
        allDay: true,
        backgroundColor: getColorByType("semester"),
        borderColor: getColorByType("semester"),
      },
    ]);
  
    const preparedBaseEvents = baseEvents.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      backgroundColor: getColorByType(e.type || "event"),
      borderColor: getColorByType(e.type || "event"),
      allDay: true,
    }));
  
    const finalEvents = [
      ...preparedBaseEvents,
      ...yearEvents,
      ...semesterEvents
    ];
  
    setEvents(finalEvents);
    console.log("✅ Final loaded events (base + years + semesters):", finalEvents);
  };
  

  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setDefaultDate(info.dateStr || info.date);
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const eventId = info.event.id;
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setSelectedEvent(found);
      setIsModalOpen(true);
    }
  };

  const handleSaveEvent = (formData) => {
    const newEvent = {
      id: selectedEvent?.id || `custom-${Date.now()}`,
      title: formData.title || formData.eventName || formData.holidayName || formData.vacationName,
      type: formData.type || "event",
      start: new Date(`${formData.date}T${formData.startTime}`),
      end: new Date(`${formData.date}T${formData.endTime}`),
      allDay: true,
    };

    const baseEvents = JSON.parse(localStorage.getItem("allEvents") || "[]");

    const updatedBaseEvents = selectedEvent
      ? baseEvents.map((evt) => (evt.id === selectedEvent.id ? { ...newEvent } : evt))
      : [...baseEvents, { ...newEvent }];

    localStorage.setItem("allEvents", JSON.stringify(updatedBaseEvents.map(evt => ({
      ...evt,
      start: evt.start instanceof Date ? evt.start.toISOString() : evt.start,
      end: evt.end instanceof Date ? evt.end.toISOString() : evt.end
    }))));

    setIsModalOpen(false);
    loadEvents();
  };

  const handleDeleteEvent = (eventToDelete) => {
    const baseEvents = JSON.parse(localStorage.getItem("allEvents") || "[]");
    const updatedBaseEvents = baseEvents.filter((evt) => evt.id !== eventToDelete.id);

    localStorage.setItem("allEvents", JSON.stringify(updatedBaseEvents));
    setIsModalOpen(false);
    loadEvents();
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      <Stack direction="row" justifyContent="flex-start" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedEvent(null);
            setDefaultDate(null);
            setIsModalOpen(true);
          }}
        >
          ➕ Add Event
        </Button>
      </Stack>

      <FullCalendarView
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
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
