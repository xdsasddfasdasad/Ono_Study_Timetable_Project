// src/components/modals/TimeTableAddModal.jsx

import React, { useState, useEffect } from "react";
import { Stack, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";

// Form Imports
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseForm from "./forms/CourseForm";
import SpesificCourseFormEdit from "./forms/SpesificCourseFormEdit";
import TaskForm from "./forms/TaskForm";
import SiteForm from "./forms/SiteForm";
import RoomForm from "./forms/RoomForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";
import EventForm from "./forms/EventForm";
import StudentPersonalEventFormModal from "./forms/StudentPersonalEventFormModal";

const formMap = {
  year: YearForm,
  semester: SemesterForm,
  lecturer: LecturerForm,
  course: CourseForm,
  spesificCourse: SpesificCourseFormEdit,
  task: TaskForm,
  site: SiteForm,
  room: RoomForm,
  holiday: HolidayForm,
  vacation: VacationForm,
  event: EventForm,
  studentEvent: StudentPersonalEventFormModal,
};

const labelMap = {
  year: "Year",
  semester: "Semester",
  lecturer: "Lecturer",
  course: "Course",
  spesificCourse: "Course Meeting",
  task: "Task",
  site: "Site",
  room: "Room",
  holiday: "Holiday",
  vacation: "Vacation",
  event: "Event",
  studentEvent: "Student Personal Event",
};

export default function TimeTableAddModal({ open, onClose, onSave }) {
  const [recordType, setRecordType] = useState("");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const FormComponent = formMap[recordType];

  useEffect(() => {
    if (!open) {
      setFormData({});
      setErrors({});
      setRecordType("");
    }
  }, [open]);

  useEffect(() => {
    if (recordType) {
      const generatedId = generateEntityId(recordType);
      setFormData((prev) => ({ ...prev, ...generatedId }));
    }
  }, [recordType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async () => {
    if (!recordType) return;

    const { success, errors } = await handleSaveOrUpdateRecord(
      getEntityKeyByRecordType(recordType),
      formData,
      "add"
    );

    if (!success) {
      setErrors(errors || {});
      return;
    }

    onSave?.();
    onClose?.();
  };

  return (
    <PopupModal open={open} onClose={onClose} title="Add New Record">
      <FormWrapper>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="record-type-select-label">Select Type</InputLabel>
          <Select
            labelId="record-type-select-label"
            value={recordType}
            label="Select Type"
            onChange={(e) => setRecordType(e.target.value)}
          >
            {Object.entries(labelMap).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {FormComponent && (
          <FormComponent
            formData={formData}
            errors={errors}
            onChange={handleChange}
            mode="add"
          />
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <CustomButton onClick={handleSave}>Save</CustomButton>
          <CustomButton onClick={onClose} variant="outlined">Cancel</CustomButton>
        </Stack>
      </FormWrapper>
    </PopupModal>
  );
}

// --- Helpers ---

function generateEntityId(type) {
  const timestamp = Date.now();
  switch (type) {
    case "year":
      return { yearCode: `Y${timestamp}` };
    case "semester":
      return { semesterCode: `S${timestamp}` };
    case "lecturer":
      return { id: `L${timestamp}` };
    case "course":
      return { courseCode: `C${timestamp}` };
    case "spesificCourse":
      return { id: `CM${timestamp}` };
    case "task":
      return { assignmentCode: `T${timestamp}` };
    case "site":
      return { siteCode: `S${timestamp}` };
    case "room":
      return { roomCode: `R${timestamp}` };
    case "holiday":
      return { holidayCode: `H${timestamp}` };
    case "vacation":
      return { vacationCode: `V${timestamp}` };
    case "event":
      return { eventCode: `E${timestamp}` };
    case "studentEvent":
      return { id: `SE${timestamp}` };
    default:
      return { id: `ID${timestamp}` };
  }
}

function getEntityKeyByRecordType(type) {
  switch (type) {
    case "year":
    case "semester":
      return "years";
    case "lecturer":
      return "lecturers";
    case "course":
      return "courses";
    case "spesificCourse":
      return "allEvents";
    case "task":
      return "tasks";
    case "site":
      return "sites";
    case "room":
      return "rooms";
    case "holiday":
      return "holidays";
    case "vacation":
      return "vacations";
    case "event":
      return "events";
    case "studentEvent":
      return "studentEvents";
    default:
      return null;
  }
}
