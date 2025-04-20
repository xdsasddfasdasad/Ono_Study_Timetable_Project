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
import { validateSemesterForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function SemesterForm({ formData, onChange, errors, onClose, onSave, options }) {
  const handleSubmit = () => {
    const validationErrors = validateSemesterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("semesters", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Semester Code"
        name="semesterCode"
        value={formData.semesterCode}
        onChange={onChange}
        error={!!errors.semesterCode}
        helperText={errors.semesterCode}
        fullWidth
      />
      <TextField
        label="Semester Number"
        name="semesterNumber"
        value={formData.semesterNumber}
        onChange={onChange}
        error={!!errors.semesterNumber}
        helperText={errors.semesterNumber}
        fullWidth
      />

      <FormControl fullWidth error={!!errors.yearCode}>
        <InputLabel>Year</InputLabel>
        <Select
          name="yearCode"
          value={formData.yearCode}
          onChange={onChange}
          label="Year"
        >
          {options?.years?.map((year) => (
            <MenuItem key={year.code} value={year.code}>
              {year.label}
            </MenuItem>
          ))}
        </Select>
        {errors.yearCode && <Typography color="error">{errors.yearCode}</Typography>}
      </FormControl>

      <CustomButton onClick={handleSubmit}>Save Semester</CustomButton>
    </Stack>
  );
}
