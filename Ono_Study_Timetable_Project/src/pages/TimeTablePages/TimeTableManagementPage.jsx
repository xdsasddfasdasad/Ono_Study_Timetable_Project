// /pages/TimeTablePages/TimeTableManagementPage.jsx

import React, { useEffect, useState } from "react";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import { Button, Stack } from "@mui/material";
import { getRecords } from "../../utils/storage";

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [recordType, setRecordType] = useState("event");
  const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);

  useEffect(() => {
    loadEvents();
    window.addEventListener("storage", loadEvents);
    return () => window.removeEventListener("storage", loadEvents);
  }, []);

  const getColorByType = (type) => {
    switch (type) {
      case "year": return "#1976d2";
      case "semester": return "#388e3c";
      case "holiday": return "#d32f2f";
      case "vacation": return "#f9a825";
      case "student": return "#7b1fa2";
      default: return "#0288d1";
    }
  };

  const loadEvents = () => {
    const baseEvents = (getRecords("allEvents") || []).filter(
      (e) =>
        !e.id?.startsWith("year-start-") &&
        !e.id?.startsWith("year-end-") &&
        !e.id?.startsWith("semester-start-") &&
        !e.id?.startsWith("semester-end-")
    );

    const years = getRecords("years") || [];

    const generatedEvents = years.flatMap((y) => {
      const yearEvents = [
        {
          id: `year-start-${y.yearCode}`,
          title: `Year ${y.yearNumber} Start`,
          type: "year",
          start: new Date(`${y.startDate}T00:00`),
          end: new Date(`${y.startDate}T23:59`),
          allDay: true,
          backgroundColor: getColorByType("year"),
          borderColor: getColorByType("year"),
          generated: true,
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
          generated: true,
        },
      ];

      const semesterEvents = (y.semesters || []).flatMap((s) => [
        {
          id: `semester-start-${s.semesterCode}`,
          title: `Semester ${s.semesterNumber} Start`,
          type: "semester",
          start: new Date(`${s.startDate}T00:00`),
          end: new Date(`${s.startDate}T23:59`),
          allDay: true,
          backgroundColor: getColorByType("semester"),
          borderColor: getColorByType("semester"),
          generated: true,
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
          generated: true,
        },
      ]);

      return [...yearEvents, ...semesterEvents];
    });

    const preparedEvents = baseEvents.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      allDay: e.allDay === true || e.allDay === "True",
      backgroundColor: getColorByType(e.type || "event"),
      borderColor: getColorByType(e.type || "event"),
    }));

    setEvents([...preparedEvents, ...generatedEvents]);
  };

  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setDefaultDate(info.dateStr || info.date);
    setRecordType("event");
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const eventId = info.event.id;
    const years = getRecords("years") || [];

    if (eventId.startsWith("year-start-") || eventId.startsWith("year-end-")) {
      const yearCode = eventId.replace("year-start-", "").replace("year-end-", "");
      const year = years.find((y) => y.yearCode === yearCode);
      if (year) {
        setRecordType("year");
        setSelectedEvent(year);
        setIsModalOpen(true);
      }
      return;
    }

    if (eventId.startsWith("semester-start-") || eventId.startsWith("semester-end-")) {
      const semesterCode = eventId.replace("semester-start-", "").replace("semester-end-", "");
      const yearWithSemester = years.find((y) =>
        (y.semesters || []).some((s) => s.semesterCode === semesterCode)
      );
      if (yearWithSemester) {
        const semester = yearWithSemester.semesters.find((s) => s.semesterCode === semesterCode);
        if (semester) {
          setRecordType("semester");
          setSelectedEvent({ ...semester, yearCode: yearWithSemester.yearCode });
          setIsModalOpen(true);
        }
      }
      return;
    }

    const baseEvents = getRecords("allEvents") || [];
    const found = baseEvents.find((e) => e.id === eventId);
    if (found) {
      setRecordType(found.type || "event");
      setSelectedEvent(found);
      setIsModalOpen(true);
    }
  };

  const handleSaveEvent = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      loadEvents();
    }, 100);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <Stack direction="row" spacing={2} mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedEvent(null);
            setDefaultDate(null);
            setRecordType("");
            setIsModalOpen(true);
          }}
        >
          Add New
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsManageEntitiesModalOpen(true)}
        >
          Manage Entities
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
        selectedEvent={selectedEvent}
        defaultDate={defaultDate}
        recordType={recordType}
        manageEntitiesOpen={isManageEntitiesModalOpen}
        setManageEntitiesOpen={setIsManageEntitiesModalOpen}
      />
    </div>
  );
}
