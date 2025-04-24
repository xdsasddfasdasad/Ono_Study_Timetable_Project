// src/pages/TimeTableManagementPage.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import TimeTableCalendarManageModal from "../components/modals/TimeTableCalendarManageModal"; // to be created

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const all = [
      ...(JSON.parse(localStorage.getItem("studentEvents")) || []),
      ...(JSON.parse(localStorage.getItem("events")) || []),
      ...(JSON.parse(localStorage.getItem("holidays")) || []),
      ...(JSON.parse(localStorage.getItem("vacations")) || []),
    ].map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }));
    setEvents(all);
  }, []);

  const handleOpenModal = (event = null) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSave = (newEvent) => {
    const updated = selectedEvent
      ? events.map((evt) => (evt === selectedEvent ? newEvent : evt))
      : [...events, newEvent];

    setEvents(updated);
    localStorage.setItem("adminEvents", JSON.stringify(updated));
    setModalOpen(false);
  };

  const handleDelete = (toDelete) => {
    const updated = events.filter((e) => e !== toDelete);
    setEvents(updated);
    localStorage.setItem("adminEvents", JSON.stringify(updated));
    setModalOpen(false);
  };

  return (
    <Box p={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">TimeTable Management</Typography>
        <Button variant="contained" onClick={() => handleOpenModal(null)}>
          Add New Event
        </Button>
      </Stack>

      <Box mt={4}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((e, i) => (
              <TableRow key={i}>
                <TableCell>{e.title || e.eventName || e.holidayName || e.vacationName}</TableCell>
                <TableCell>{new Date(e.start).toLocaleString()}</TableCell>
                <TableCell>{new Date(e.end).toLocaleString()}</TableCell>
                <TableCell>{e.type || "event"}</TableCell>
                <TableCell align="right">
                  <Button onClick={() => handleOpenModal(e)}>Edit</Button>
                  <Button color="error" onClick={() => handleDelete(e)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <TimeTableCalendarManageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        selectedEvent={selectedEvent}
      />
    </Box>
  );
}
