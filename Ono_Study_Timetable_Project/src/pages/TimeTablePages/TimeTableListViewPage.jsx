import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Divider,
} from "@mui/material";
import StudentPersonalEventFormModal from "../components/modals/StudentPersonalEventFormModal";

export default function TimeTableListViewPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = (eventToDelete) => {
    const updated = events.filter((e) => e !== eventToDelete);
    setEvents(updated);
    localStorage.setItem("studentEvents", JSON.stringify(
      updated.filter((e) => e.eventType === "personal")
    ));
  };

  const handleSave = (formData) => {
    const newEvent = {
      ...formData,
      start: new Date(`${formData.date}T${formData.startTime}`),
      end: new Date(`${formData.date}T${formData.endTime}`),
      eventType: "personal",
    };

    const updated = selectedEvent
      ? events.map((e) => (e === selectedEvent ? newEvent : e))
      : [...events, newEvent];

    setEvents(updated);
    localStorage.setItem(
      "studentEvents",
      JSON.stringify(updated.filter((e) => e.eventType === "personal"))
    );

    setIsModalOpen(false);
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
