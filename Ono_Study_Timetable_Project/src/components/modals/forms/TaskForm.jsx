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
import { validateTaskForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function TaskForm({ formData, onChange, errors, onClose, onSave, options }) {
  const handleSubmit = () => {
    const validationErrors = validateTaskForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("tasks", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Assignment Name"
        name="assignmentName"
        value={formData.assignmentName}
        onChange={onChange}
        error={!!errors.assignmentName}
        helperText={errors.assignmentName}
        fullWidth
      />

      <FormControl fullWidth error={!!errors.courseCode}>
        <InputLabel>Course</InputLabel>
        <Select
          name="courseCode"
          value={formData.courseCode}
          onChange={onChange}
          label="Course"
        >
          {options?.courses?.map((course) => (
            <MenuItem key={course.code} value={course.code}>
              {course.name}
            </MenuItem>
          ))}
        </Select>
        {errors.courseCode && <Typography color="error">{errors.courseCode}</Typography>}
      </FormControl>

      <CustomButton onClick={handleSubmit}>Save Task</CustomButton>
    </Stack>
  );
}
