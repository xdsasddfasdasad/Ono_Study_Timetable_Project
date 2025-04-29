import React, { useState, useEffect } from "react";
import { TextField, Stack } from "@mui/material";
import { validateLecturerForm } from "../../../utils/validateForm";
import { saveRecord, getRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function LecturerForm({ formData, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    id: "",
    name: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) {
      setLocalForm(formData);
    } else {
      generateNextLecturerId();
    }
  }, [formData]);

  const generateNextLecturerId = () => {
    const existingLecturers = getRecords("lecturers") || [];
    const numbers = existingLecturers
      .map((lec) => parseInt(lec.id.replace("L", ""), 10))
      .filter((n) => !isNaN(n));
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const nextId = `L${nextNumber}`;
    setLocalForm((prev) => ({ ...prev, id: nextId }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = () => {
    const existingLecturers = getRecords("lecturers") || [];
  
    const validationErrors = validateLecturerForm(localForm, existingLecturers);
  
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }
  
    // Passed validation
    saveRecord("lecturers", localForm);
    if (onSave) onSave(localForm);
  
    setLocalForm({ id: "", name: "" });
    setLocalErrors({});
    onClose?.();
  };
  

  return (
    <Stack spacing={3}>
      {/* Lecturer Name only (no ID shown anymore) */}
      <TextField
        label="Lecturer Name"
        name="name"
        value={localForm.name}
        onChange={handleChange}
        error={!!localErrors.name}
        helperText={localErrors.name}
        fullWidth
      />

      <CustomButton onClick={handleSubmit}>Save Lecturer</CustomButton>
    </Stack>
  );
}
