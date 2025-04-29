// UI/FormWrapper.jsx
import React from "react";

/**
 * A wrapper component to render any form dynamically based on recordType
 * and unify the props (formData, errors, onChange, onSave, onClose, options).
 */
export default function FormWrapper({
  recordType,
  formData,
  errors = {},
  onChange,
  onSave,
  onClose,
  options = {},
  defaultDate
}) {
  const formMap = {
    year: require("./YearForm.jsx").default,
    semester: require("./SemesterForm.jsx").default,
    lecturer: require("./LecturerForm.jsx").default,
    course: require("./CourseForm.jsx").default,
    task: require("./TaskForm.jsx").default,
    site: require("./SiteForm.jsx").default,
    room: require("./RoomForm.jsx").default,
    holiday: require("./HolidayForm.jsx").default,
    vacation: require("./VacationForm.jsx").default,
    event: require("./EventForm.jsx").default,
    studentEvent: require("../StudentPersonalEventFormModal.jsx").default,
    student: require("../AddStudentFormModal.jsx").default,
    editStudent: require("../EditStudentFormModal.jsx").default,
  };

  const FormComponent = formMap[recordType];

  if (!FormComponent) {
    return <p style={{ color: "red" }}>Unknown form type: {recordType}</p>;
  }

  return (
    <FormComponent
      formData={formData}
      errors={errors}
      onChange={onChange}
      onSave={onSave}
      onClose={onClose}
      options={options}
      defaultDate={defaultDate}
    />
  );
}
