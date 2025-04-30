// src/components/modals/TimeTableEditModal.jsx

import React, { useEffect, useState } from "react";
import FormWrapper from "../UI/FormWrapper";
import CustomButton from "../UI/CustomButton";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";

// All form components
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
import PopupModal from "../UI/PopupModal";

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

export default function TimeTableEditModal({
  open,
  onClose,
  onSave,
  selectedEvent,
  recordType,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const FormComponent = formMap[recordType];

  useEffect(() => {
    if (selectedEvent) {
      setFormData(selectedEvent);
    }
  }, [selectedEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleUpdate = async () => {
    if (!recordType || !formData) return;

    const entityKey = getEntityKeyByRecordType(recordType);

    const { success, errors } = await handleSaveOrUpdateRecord(
      entityKey,
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

  return (
    <PopupModal open={open} onClose={onClose} title="Edit Record">
      <FormWrapper>
        {FormComponent && (
          <FormComponent
            formData={formData}
            errors={errors}
            onChange={handleChange}
            mode="edit"
          />
        )}

        <CustomButton onClick={handleUpdate}>Update</CustomButton>
        <CustomButton variant="outlined" onClick={onClose}>
          Cancel
        </CustomButton>
      </FormWrapper>
    </PopupModal>
  );
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
