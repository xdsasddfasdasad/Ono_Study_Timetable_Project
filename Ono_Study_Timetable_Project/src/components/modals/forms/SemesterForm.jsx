import React, { useState, useEffect } from "react";
import {
  TextField,
  Stack,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { validateSemesterForm } from "../../../utils/validateForm";
import { saveRecord, getRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function SemesterForm({ formData, onClose, onSave, options }) {
  const [localForm, setLocalForm] = useState({
    semesterNumber: "",
    yearCode: "",
    startDate: "",
    endDate: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) setLocalForm(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = () => {
    const preparedData = {
      ...localForm,
      semesterCode: `S${localForm.semesterNumber}`,
    };

    const existingSemesters = getRecords("semesters") || [];
    const yearRecord = options?.years?.find((year) => year.yearCode === localForm.yearCode) || null;

    const validationErrors = validateSemesterForm(localForm, existingSemesters, yearRecord);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    // Passed validation
    saveRecord("semesters", preparedData);
    if (onSave) onSave(preparedData);
    setLocalForm({ semesterNumber: "", yearCode: "", startDate: "", endDate: "" });
    setLocalErrors({});
    onClose?.();
  };

  return (
    <Stack spacing={3}>
      {/* --- Semester Information --- */}
      <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, position: "relative" }}>
        <Typography
          variant="subtitle2"
          sx={{
            position: "absolute",
            top: -10,
            left: 10,
            bgcolor: "background.paper",
            px: 0.5,
            fontWeight: "bold",
            fontSize: "0.85rem",
          }}
        >
          Semester Information
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Semester Number"
            name="semesterNumber"
            value={localForm.semesterNumber || ""}
            onChange={handleChange}
            error={!!localErrors.semesterNumber}
            helperText={localErrors.semesterNumber}
            fullWidth
          />

          <FormControl fullWidth error={!!localErrors.yearCode}>
            <InputLabel>Year</InputLabel>
            <Select
              name="yearCode"
              value={localForm.yearCode || ""}
              onChange={handleChange}
              label="Year"
            >
              {options?.years?.map((year) => (
                <MenuItem key={year.yearCode} value={year.yearCode}>
                  {year.label}
                </MenuItem>
              ))}
            </Select>
            {localErrors.yearCode && (
              <Typography color="error" variant="caption">
                {localErrors.yearCode}
              </Typography>
            )}
          </FormControl>
        </Stack>
      </Box>

      {/* --- Semester Dates --- */}
      <Box sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, position: "relative" }}>
        <Typography
          variant="subtitle2"
          sx={{
            position: "absolute",
            top: -10,
            left: 10,
            bgcolor: "background.paper",
            px: 0.5,
            fontWeight: "bold",
            fontSize: "0.85rem",
          }}
        >
          Semester Dates
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={localForm.startDate || ""}
            onChange={handleChange}
            error={!!localErrors.startDate}
            helperText={localErrors.startDate}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={localForm.endDate || ""}
            onChange={handleChange}
            error={!!localErrors.endDate}
            helperText={localErrors.endDate}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </Box>

      <CustomButton onClick={handleSubmit}>Save Semester</CustomButton>
    </Stack>
  );
}
