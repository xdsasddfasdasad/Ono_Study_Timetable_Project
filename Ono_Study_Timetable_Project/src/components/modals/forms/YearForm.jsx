import React, { useState, useEffect } from "react";
import { TextField, Stack, Box, Typography } from "@mui/material";
import { validateYearForm } from "../../../utils/validateForm";
import { saveRecord, getRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function YearForm({ formData, onChange, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    yearNumber: "",
    startDate: "",
    endDate: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) setLocalForm(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined })); // clear field error on change
  };

  const handleSubmit = () => {
    const preparedData = {
      ...localForm,
      yearCode: `Y${localForm.yearNumber.trim()}`,
      label: `Year ${localForm.yearNumber.trim()}`,
    };

    const existingYears = getRecords("years") || [];
    const validationErrors = validateYearForm(localForm, existingYears);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors); // Update local error state
      return;
    }

    // Passed validation
    saveRecord("years", preparedData);
    if (onSave) onSave(preparedData);
    setLocalForm({ yearNumber: "", startDate: "", endDate: "" }); // Reset form
    setLocalErrors({}); // Clear errors after successful save
    onClose?.();
  };

  return (
    <Stack spacing={3}>
      {/* --- Year Info Section --- */}
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
          Year Information
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Year Number"
            name="yearNumber"
            value={localForm.yearNumber || ""}
            onChange={handleChange}
            error={!!localErrors.yearNumber}
            helperText={localErrors.yearNumber}
            fullWidth
          />
        </Stack>
      </Box>

      {/* --- Year Dates Section --- */}
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
          Year Dates
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

      <CustomButton onClick={handleSubmit}>Save Year</CustomButton>
    </Stack>
  );
}
