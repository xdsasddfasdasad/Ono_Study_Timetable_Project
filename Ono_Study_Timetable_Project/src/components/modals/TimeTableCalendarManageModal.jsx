// src/components/modals/TimeTableCalendarManageModal.jsx

import React, { useState, useEffect } from "react";
import { Stack, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";

import YearForm from "../modals/forms/YearForm";
import SemesterForm from "../modals/forms/SemesterForm";
import LecturerForm from "../modals/forms/LecturerForm";
import CourseForm from "../modals/forms/CourseForm";
import SpesificCourseFormEdit from "../modals/forms/SpesificCourseFormEdit";
import TaskForm from "../modals/forms/TaskForm";
import SiteForm from "../modals/forms/SiteForm";
import RoomForm from "../modals/forms/RoomForm";
import HolidayForm from "../modals/forms/HolidayForm";
import VacationForm from "../modals/forms/VacationForm";
import EventForm from "../modals/forms/EventForm";
import StudentPersonalEventFormModal from "../modals/forms/StudentPersonalEventFormModal";
import AddStudentFormModal from "../modals/forms/AddStudentFormModal";
import EditStudentFormModal from "../modals/forms/EditStudentFormModal";

import {
  handleEntityFormSubmit,
  handleUpdateEntityFormSubmit,
  handleDeleteEntityFormSubmit
} from "../../handlers/formHandlers";

const formMap = {
  year: YearForm,
  semester: SemesterForm,
  lecturer: LecturerForm,
  course: CourseForm,
  coursemeeting: SpesificCourseFormEdit,
  task: TaskForm,
  site: SiteForm,
  room: RoomForm,
  holiday: HolidayForm,
  vacation: VacationForm,
  event: EventForm,
  StudentPersonalEvent: StudentPersonalEventFormModal,
  student: AddStudentFormModal,
  editStudent: EditStudentFormModal,
};

const getStorageKeyByType = (type) => {
  switch (type) {
    case "year": return "years";
    case "semester": return "years";
    case "lecturer": return "lecturers";
    case "course": return "courses";
    case "coursemeeting": return "coursesMeetings";
    case "task": return "tasks";
    case "site": return "sites";
    case "room": return "sites";
    case "holiday": return "holidays";
    case "vacation": return "vacations";
    case "event": return "events";
    case "StudentPersonalEvent": return "studentEvents";
    case "student": return "students";
    case "editStudent": return "students";
    default: return null;
  }
};

export default function TimeTableCalendarManageModal({
  open,
  onClose,
  onSave,
  selectedEvent,
  defaultDate,
  recordType: initialType
}) {
  const [formData, setFormData] = useState(selectedEvent || {});
  const [errors, setErrors] = useState({});
  const [recordType, setRecordType] = useState(initialType || "");

  useEffect(() => {
    setFormData(selectedEvent || {});
    setRecordType(initialType || "");
    setErrors({});
  }, [selectedEvent, initialType]);

  const FormComponent = formMap[recordType];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async () => {
    const storageKey = getStorageKeyByType(recordType);
    if (!storageKey) return;

    const isEdit = selectedEvent && selectedEvent.id;
    const handler = isEdit ? handleUpdateEntityFormSubmit : handleEntityFormSubmit;

    const callback = (msg) => {
      alert(msg);
      if (onSave) onSave();
      onClose();
    };

    await handler(storageKey, formData,
      callback,
      (msg, errObj) => {
        alert(msg);
        if (errObj) setErrors(errObj);
      });
  };

  const handleDelete = async () => {
    const storageKey = getStorageKeyByType(recordType);
    if (!storageKey || !selectedEvent?.id) return;
    handleDeleteEntityFormSubmit(storageKey, selectedEvent.id,
      (msg) => {
        alert(msg);
        if (onSave) onSave();
        onClose();
      },
      (msg) => alert(msg)
    );
  };

  return (
    <PopupModal open={open} onClose={onClose} title={selectedEvent ? "Edit Record" : "Add New Record"}>
      <FormWrapper>
        {!selectedEvent && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Type</InputLabel>
            <Select
              value={recordType}
              label="Select Type"
              onChange={(e) => setRecordType(e.target.value)}
            >
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="StudentPersonalEvent">Student Personal Event</MenuItem>
              <MenuItem value="task">Task</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
              <MenuItem value="vacation">Vacation</MenuItem>
              <MenuItem value="course">Course</MenuItem>
              <MenuItem value="coursemeeting">Course Meeting</MenuItem>
              <MenuItem value="lecturer">Lecturer</MenuItem>
              <MenuItem value="site">Site</MenuItem>
              <MenuItem value="year">Year</MenuItem>
              <MenuItem value="semester">Semester</MenuItem>
              <MenuItem value="room">Room</MenuItem>
              <MenuItem value="student">Student</MenuItem>
            </Select>
          </FormControl>
        )}

        {FormComponent && (
          <FormComponent
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onSave={handleSave}
            onClose={onClose}
          />
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <CustomButton onClick={handleSave}>Save</CustomButton>
          {selectedEvent && <CustomButton onClick={handleDelete} color="error">Delete</CustomButton>}
          <CustomButton onClick={onClose} variant="outlined">Cancel</CustomButton>
        </Stack>
      </FormWrapper>
    </PopupModal>
  );
}
  