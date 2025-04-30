// src/pages/TimeTableManagementPage.jsx

import React, { useEffect, useState } from "react";
import FullCalendarView from "../../components/calendar/FullCalendarView";
import TimeTableCalendarManageModal from "../../components/modals/TimeTableCalendarManageModal";
import { Button, Stack, Select, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { getRecords } from "../../utils/storage";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";

export default function TimeTableManagementPage() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);
  const [recordType, setRecordType] = useState("event");

  const [isManageEntitiesModalOpen, setIsManageEntitiesModalOpen] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [selectedEntityRecord, setSelectedEntityRecord] = useState(null);
  const [entityRecords, setEntityRecords] = useState([]);
  const [localForm, setLocalForm] = useState({});

  useEffect(() => {
    loadEvents();
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
    const baseEvents = getRecords("allEvents") || [];
    const years = getRecords("years") || [];

    const yearSemesterEvents = years.flatMap((y) => {
      const yearItems = [
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
      ];

      const semesterItems = (y.semesters || []).flatMap((s) => [
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

      return [...yearItems, ...semesterItems];
    });

    const preparedBaseEvents = baseEvents.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
      backgroundColor: getColorByType(e.type || "event"),
      borderColor: getColorByType(e.type || "event"),
      allDay: e.allDay === true || e.allDay === "True",
    }));

    setEvents([...preparedBaseEvents, ...yearSemesterEvents]);
  };

  const handleDateClick = (info) => {
    setSelectedEvent(null);
    setDefaultDate(info.dateStr || info.date);
    setRecordType("event");
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const eventId = info.event.id;
    const baseEvents = getRecords("allEvents") || [];
    const years = getRecords("years") || [];

    let found = baseEvents.find((e) => e.id === eventId);

    if (!found) {
      if (eventId.startsWith("year-start-") || eventId.startsWith("year-end-")) {
        const yearCode = eventId.replace("year-start-", "").replace("year-end-", "");
        found = years.find((y) => y.yearCode === yearCode);
        if (found) {
          setRecordType("year");
          setSelectedEvent(found);
          setIsModalOpen(true);
          return;
        }
      }
      if (eventId.startsWith("semester-start-") || eventId.startsWith("semester-end-")) {
        const semesterCode = eventId.replace("semester-start-", "").replace("semester-end-", "");
        const yearContainingSemester = years.find((y) => (y.semesters || []).some((s) => s.semesterCode === semesterCode));
        if (yearContainingSemester) {
          const semester = yearContainingSemester.semesters.find((s) => s.semesterCode === semesterCode);
          if (semester) {
            setRecordType("semester");
            setSelectedEvent({
              ...semester,
              yearCode: yearContainingSemester.yearCode
            });
            setIsModalOpen(true);
            return;
          }
        }
      }
    }

    if (found) {
      setSelectedEvent(found);
      setRecordType(found.type || "event");
      setIsModalOpen(true);
    }
  };

  const handleSaveEvent = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      loadEvents();
    }, 100);
  };

  const handleEntityTypeChange = (e) => {
    const value = e.target.value;
    setSelectedEntityType(value);
    const records = getRecords(value) || [];
    setEntityRecords(records);
    setSelectedEntityRecord(null);
    setLocalForm({});
  };

  const handleEntitySelect = (e) => {
    const selectedId = e.target.value;
    const record = entityRecords.find((rec) => rec.id === selectedId || rec.siteCode === selectedId || rec.roomCode === selectedId);
    if (record) {
      setSelectedEntityRecord(record);
      setLocalForm(record);
    }
  };

  const handleEntityFieldChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEntity = async () => {
    if (!selectedEntityType || !localForm) return;

    const { success, errors } = await handleSaveOrUpdateRecord(
      selectedEntityType,
      localForm,
      "edit"
    );

    if (success) {
      setIsManageEntitiesModalOpen(false);
    } else {
      console.error(errors);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
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
          ➕ Add New
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => setIsManageEntitiesModalOpen(true)}
        >
          ⚙️ Manage Entities
        </Button>
      </Stack>

      <FullCalendarView
        events={events}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
      />

      {/* Existing Modal for Events */}
      <TimeTableCalendarManageModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        selectedEvent={selectedEvent}
        defaultDate={defaultDate}
        recordType={recordType}
      />

      {/* New Modal for Manage Entities */}
      <Dialog open={isManageEntitiesModalOpen} onClose={() => setIsManageEntitiesModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Entities</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Select
              value={selectedEntityType}
              onChange={handleEntityTypeChange}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>Select Entity Type</MenuItem>
              <MenuItem value="lecturers">Lecturers</MenuItem>
              <MenuItem value="rooms">Rooms</MenuItem>
              <MenuItem value="sites">Sites</MenuItem>
            </Select>

            {selectedEntityType && (
              <Select
                value={selectedEntityRecord?.id || selectedEntityRecord?.roomCode || selectedEntityRecord?.siteCode || ""}
                onChange={handleEntitySelect}
                fullWidth
                displayEmpty
              >
                <MenuItem value="" disabled>Select Specific Record</MenuItem>
                {entityRecords.map((rec) => (
                  <MenuItem key={rec.id || rec.roomCode || rec.siteCode} value={rec.id || rec.roomCode || rec.siteCode}>
                    {rec.name || rec.roomName || rec.siteName}
                  </MenuItem>
                ))}
              </Select>
            )}

            {selectedEntityRecord && (
              <>
                {Object.keys(localForm).map((field) => (
                  (field !== "id" && field !== "siteCode" && field !== "roomCode") && (
                    <TextField
                      key={field}
                      name={field}
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={localForm[field] || ""}
                      onChange={handleEntityFieldChange}
                      fullWidth
                    />
                  )
                ))}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsManageEntitiesModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveEntity}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
