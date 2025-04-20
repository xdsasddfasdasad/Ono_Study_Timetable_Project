import React, { useEffect, useState } from "react";
import {
  TextField,
  Stack,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import PopupModal from "../UI/PopupModal";
import CustomButton from "../UI/CustomButton";

import { validateOnlineClassForm } from "../../utils/validateForm";
import { getCoursesFromStorage, getHoursFromStorage } from "../../utils/storage";

const OnlineClassRegistrationFormModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    courseCode: "",
    date: "",
    hourCode: "",
    isOnline: false,
    link: "",
  });

  const [errors, setErrors] = useState({});
  const [options, setOptions] = useState({ courses: [], hours: [] });

  useEffect(() => {
    const courses = getCoursesFromStorage();
    const hours = getHoursFromStorage();
    setOptions({ courses, hours });
  }, [open]); // refresh options every time modal opens

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    const validationErrors = validateOnlineClassForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (onSave) onSave(formData);
    setFormData({
      courseCode: "",
      date: "",
      hourCode: "",
      isOnline: false,
      link: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Assign Online Class"
      actions={<CustomButton onClick={handleSubmit}>Save</CustomButton>}
    >
      <Stack spacing={2}>
        <FormControl fullWidth error={!!errors.courseCode}>
          <InputLabel id="course-label">Course</InputLabel>
          <Select
            labelId="course-label"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            label="Course"
          >
            {options.courses.map((course) => (
              <MenuItem key={course.code} value={course.code}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          error={!!errors.date}
          helperText={errors.date}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth error={!!errors.hourCode}>
          <InputLabel id="hour-label">Hour</InputLabel>
          <Select
            labelId="hour-label"
            name="hourCode"
            value={formData.hourCode}
            onChange={handleChange}
            label="Hour"
          >
            {options.hours.map((hour) => (
              <MenuItem key={hour.code} value={hour.code}>
                {`${hour.startTime} - ${hour.endTime}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleChange}
            />
          }
          label="Available Online"
        />

        {formData.isOnline && (
          <TextField
            label="Meeting Link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            error={!!errors.link}
            helperText={errors.link}
            fullWidth
          />
        )}
      </Stack>
    </PopupModal>
  );
};

export default OnlineClassRegistrationFormModal;
