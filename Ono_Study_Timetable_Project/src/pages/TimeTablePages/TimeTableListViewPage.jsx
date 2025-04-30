// src/pages/TimeTablePages/TimeTableListViewPage.jsx

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import StudentPersonalEventFormModal from "../../components/modals/forms/StudentPersonalEventFormModal";
import {
  handleSaveOrUpdateRecord,
  handleDeleteEntityFormSubmit
} from "../../handlers/formHandlers";
import { getRecords } from "../../utils/storage";

export default function TimeTableListViewPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadEvents = () => {
    const load = (key, eventType) =>
      (getRecords(key) || []).map((e) => ({
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
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (eventToDelete) => {
    if (!eventToDelete?.id) return;

    handleDeleteEntityFormSubmit(
      "studentEvents",
      eventToDelete.id,
      () => {
        alert("Event deleted successfully!");
        loadEvents();
      },
      (msg) => alert(msg)
    );
  };

  const handleSave = async () => {
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

  return (
    <div style={{ padding: "2rem" }}>
      <Typography variant="h4" gutterBottom>
        📋 Timetable List View
      </Typography>

      <Stack spacing={2}>
        {events.map((event, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2">
                {event.start.toLocaleString()} → {event.end.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Type: {event.eventType}
              </Typography>
              {event.eventType === "personal" && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" onClick={() => handleEdit(event)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(event)}
                  >
                    Delete
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>

      {isModalOpen && (
        <StudentPersonalEventFormModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleSave}
          selectedEvent={selectedEvent}
        />
      )}
    </div>
  );
}
