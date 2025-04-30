import React from "react";
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";

export default function TimeTableCalendarManageModal({
  open,
  onClose,
  onSave,
  selectedEvent,
  recordType,
}) {
  return selectedEvent ? (
    <TimeTableEditModal
      open={open}
      onClose={onClose}
      onSave={onSave}
      selectedEvent={selectedEvent}
      recordType={recordType}
    />
  ) : (
    <TimeTableAddModal open={open} onClose={onClose} onSave={onSave} />
  );
}
