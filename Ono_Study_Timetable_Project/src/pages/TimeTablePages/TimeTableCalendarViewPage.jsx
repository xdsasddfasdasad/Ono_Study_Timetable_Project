// src/pages/TimeTablePages/TimeTableCalendarViewPage.jsx

import React, { useState, useEffect } from "react";
import { Button, Stack, Typography } from "@mui/material";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal";
import {
  handleSaveOrUpdateRecord,
  handleDeleteEntityFormSubmit
} from "../../handlers/formHandlers";
import { getRecords } from "../../utils/storage";

export default function TimeTableCalendarViewPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  const loadEvents = () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    const load = (key, type) =>
      (getRecords(key) || []).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        eventType: type,
      }));

    const all = [
      ...load("studentEvents", "personal"),
      ...load("onlineClasses", "onlineClass"),
      ...load("events", "event"),
      ...load("holidays", "holiday"),
      ...load("vacations", "vacation"),
    ];

    setEvents(all);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setDefaultDate(new Date(info.date || info.dateStr)); // ✅ Force Date object
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const eventId = info.event.id;
    const allEvents = getRecords("studentEvents") || [];
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    const found = allEvents.find((e) => e.id === eventId && e.ownerId === user?.id);

    if (found) {
      setSelectedEvent({
        ...found,
        date: found.start.toISOString().split("T")[0],
        startTime: found.start.toISOString().substring(11, 16),
        endTime: found.end.toISOString().substring(11, 16),
      });
      setIsModalOpen(true);
    }
  };

  const handleSave= async () => {
    const actionType = formData?.id ? "edit" : "add";
  
    const { success, errors } = await handleSaveOrUpdateRecord(
      "students",
      localForm,
      actionType
    );
  
    if (!success) {
      setLocalErrors(errors || {});
      return;
    }
    
    if (onSave) onSave(localForm);
    onClose?.();
  };
  

  const handleDelete = (formData) => {
    if (!formData?.id) return;

    handleDeleteEntityFormSubmit(
      "studentEvents",
      formData.id,
      () => {
        alert("Event deleted successfully!");
        setIsModalOpen(false);
        loadEvents();
      },
      (msg) => alert(msg)
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedEvent(null);
            setDefaultDate(new Date());
            setIsModalOpen(true);
          }}
        >
          ➕ Add New Personal Event
        </Button>
      </Stack>

      <FullCalendarView
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {isModalOpen && (
        <StudentPersonalEventFormModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          defaultDate={defaultDate}
          selectedEvent={selectedEvent}
        />
      )}
    </div>
  );
}
