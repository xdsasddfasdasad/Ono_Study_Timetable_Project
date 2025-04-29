import React, { useState, useEffect } from "react";
import { TextField, Stack, Box, Typography } from "@mui/material";
import { validateYearForm } from "../../../utils/validateForm";
import { saveRecord, updateRecord, getRecords } from "../../../utils/storage"; // Important: added updateRecord
import CustomButton from "../../UI/CustomButton";

export default function YearForm({ formData, onChange, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    yearNumber: "",
    startDate: "",
    endDate: "",
    semesters: [],
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) {
      setLocalForm((prev) => ({
        ...prev,
        ...formData,
        semesters: formData.semesters || [],
      }));
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = () => {
    const preparedData = {
      ...localForm,
      yearCode: localForm.yearCode || `Y${localForm.yearNumber.trim()}`,
      label: localForm.label || `Year ${localForm.yearNumber.trim()}`,
      semesters: localForm.semesters || [],
    };

    const existingYears = getRecords("years") || [];
    const validationErrors = validateYearForm(preparedData, existingYears);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    // Check if this is a new record or update existing
    const isEdit = !!localForm.yearCode && existingYears.some((y) => y.yearCode === localForm.yearCode);

    if (isEdit) {
      updateRecord("years", "yearCode", preparedData);
    } else {
      saveRecord("years", preparedData);
    }

    if (onSave) onSave(preparedData);

    setLocalForm({ yearNumber: "", startDate: "", endDate: "", semesters: [] });
    setLocalErrors({});
    onClose?.();
  };

  return (
    <Stack spacing={3}>
      {/* Year Info */}
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

      {/* Year Dates */}
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

      <CustomButton onClick={handleSubmit}>
        {localForm.yearCode ? "Update Year" : "Save Year"}
      </CustomButton>
    </Stack>
  );
}
