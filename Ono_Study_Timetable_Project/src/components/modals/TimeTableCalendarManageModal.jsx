import React, { useState } from "react";
import { Box, MenuItem, Select, Stack, Typography } from "@mui/material";
import PopupModal from "../UI/PopupModal";

// Import dynamic forms
import YearForm from "./forms/YearForm";
import SemesterForm from "./forms/SemesterForm";
import LecturerForm from "./forms/LecturerForm";
import CourseForm from "./forms/CourseForm";
import TaskForm from "./forms/TaskForm";
import RoomForm from "./forms/RoomForm";
import SiteForm from "./forms/SiteForm";
import EventForm from "./forms/EventForm";
import HolidayForm from "./forms/HolidayForm";
import VacationForm from "./forms/VacationForm";

import { getRecords } from "../../utils/storage";

import {
  validateYearForm,
  validateSemesterForm,
  validateLecturerForm,
  validateCourseForm,
  validateTaskForm,
  validateRoomForm,
  validateSiteForm,
  validateEventForm,
  validateHolidayForm,
  validateVacationForm,
} from "../../utils/validateForm";

const formComponents = {
  year: YearForm,
  semester: SemesterForm,
  lecturer: LecturerForm,
  course: CourseForm,
  task: TaskForm,
  room: RoomForm,
  site: SiteForm,
  event: EventForm,
  holiday: HolidayForm,
  vacation: VacationForm,
};

const validatorMap = {
  year: validateYearForm,
  semester: validateSemesterForm,
  lecturer: validateLecturerForm,
  course: validateCourseForm,
  task: validateTaskForm,
  room: validateRoomForm,
  site: validateSiteForm,
  event: validateEventForm,
  holiday: validateHolidayForm,
  vacation: validateVacationForm,
};

const TimeTableCalendarManageModal = ({ open, onClose, onSave }) => {
  const [recordType, setRecordType] = useState("event");
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const options = {
    lecturers: getRecords("lecturers"),
    semesters: getRecords("semesters"),
    courses: getRecords("courses"),
    rooms: getRecords("rooms"),
    sites: getRecords("sites"),
    years: getRecords("years"),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const validator = validatorMap[recordType];
    return validator ? validator(formData) : {};
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setGeneralError("Please fix the errors before submitting.");
      return;
    }

    if (onSave) onSave({ type: recordType, data: formData });
    setFormData({});
    setErrors({});
    setGeneralError("");
    onClose();
  };

  const SelectedForm = formComponents[recordType];

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Add New Record"
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle2">Select Record Type:</Typography>
          <Select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value)}
            fullWidth
          >
            {Object.keys(formComponents).map((type) => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {generalError && <Typography color="error">{generalError}</Typography>}

        {SelectedForm && (
          <SelectedForm
            formData={formData}
            onChange={handleChange}
            errors={errors}
            options={options}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </Stack>
    </PopupModal>
  );
};

export default TimeTableCalendarManageModal;
