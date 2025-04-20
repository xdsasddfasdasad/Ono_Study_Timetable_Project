import React from "react";
import {
  TextField,
  Stack,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { validateCourseForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function CourseForm({ formData, onChange, errors, onClose, onSave, options }) {
  const handleSubmit = () => {
    const validationErrors = validateCourseForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    // ✅ Save directly to localStorage
    saveRecord("courses", formData);

    // Optional external handler
    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Course Code"
        name="courseCode"
        value={formData.courseCode}
        onChange={onChange}
        error={!!errors.courseCode}
        helperText={errors.courseCode}
        fullWidth
      />
      <TextField
        label="Course Name"
        name="courseName"
        value={formData.courseName}
        onChange={onChange}
        error={!!errors.courseName}
        helperText={errors.courseName}
        fullWidth
      />

      <FormControl fullWidth error={!!errors.lecturerId}>
        <InputLabel>Lecturer</InputLabel>
        <Select
          name="lecturerId"
          value={formData.lecturerId}
          onChange={onChange}
          label="Lecturer"
        >
          {options?.lecturers?.map((lec) => (
            <MenuItem key={lec.id} value={lec.id}>
              {lec.name}
            </MenuItem>
          ))}
        </Select>
        {errors.lecturerId && <Typography color="error">{errors.lecturerId}</Typography>}
      </FormControl>

      <FormControl fullWidth error={!!errors.semesterCode}>
        <InputLabel>Semester</InputLabel>
        <Select
          name="semesterCode"
          value={formData.semesterCode}
          onChange={onChange}
          label="Semester"
        >
          {options?.semesters?.map((sem) => (
            <MenuItem key={sem.code} value={sem.code}>
              {sem.name}
            </MenuItem>
          ))}
        </Select>
        {errors.semesterCode && <Typography color="error">{errors.semesterCode}</Typography>}
      </FormControl>

      <CustomButton onClick={handleSubmit}>Save Course</CustomButton>
    </Stack>
  );
}
