// src/components/calendar/FullCalendarView.jsx

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function FullCalendarView({ events, onDateClick, onEventClick }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events.map((event) => ({
        ...event,
        display: event.allDay ? "auto" : "block", // 👈 Important: non-allDay events show inside hours
      }))}
      dateClick={onDateClick}
      eventClick={onEventClick}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      selectable={true}
      editable={true}
      height="auto"
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false, // 👈 24-hour format instead of AM/PM
        hour12: false,
      }}
      eventMouseEnter={(info) => {
        info.el.style.border = "2px solid black";
      }}
      eventMouseLeave={(info) => {
        info.el.style.border = "";
      }}
    />
  );
}
