// src/components/modals/TimeTableEditModal.jsx

import React, { useEffect, useState } from "react";
import { Stack } from "@mui/material";
import PopupModal from "../UI/PopupModal";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";

import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers";

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

export default function TimeTableEditModal({ open, onClose, onSave, recordType, selectedEvent }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const FormComponent = formMap[recordType];

  useEffect(() => {
    setFormData(selectedEvent || {});
    setErrors({});
  }, [selectedEvent, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async () => {
    const { success, errors } = await handleSaveOrUpdateRecord(
      getEntityKeyByRecordType(recordType),
      formData,
      "edit"
    );

    if (!success) {
      setErrors(errors || {});
      return;
    }

    onSave?.();
    onClose?.();
  };

  const handleDelete = () => {
    const matchKeyValue =
      formData.id || formData.roomCode || formData.siteCode || formData.courseCode;

    handleDeleteEntityFormSubmit(
      getEntityKeyByRecordType(recordType),
      matchKeyValue,
      onSave,
      () => setErrors({ general: "Failed to delete record." })
    );

    onClose?.();
  };

  return (
    <PopupModal open={open} onClose={onClose} title="Edit Record">
      <FormWrapper>
        {FormComponent && (
          <FormComponent
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onClose={onClose}
            mode="edit"
          />
        )}

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <CustomButton onClick={handleSave}>Save</CustomButton>
          <CustomButton onClick={handleDelete} color="error">Delete</CustomButton>
          <CustomButton onClick={onClose} variant="outlined">Cancel</CustomButton>
        </Stack>
      </FormWrapper>
    </PopupModal>
  );
}

// -- Helpers --

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
