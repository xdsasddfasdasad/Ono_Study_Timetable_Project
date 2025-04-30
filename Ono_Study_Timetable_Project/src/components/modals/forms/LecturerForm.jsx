// src/components/forms/LecturerForm.jsx

import React, { useState, useEffect } from "react";
import { TextField, Stack } from "@mui/material";
import { getRecords } from "../../../utils/storage";
import { handleSaveOrUpdateRecord } from "../../../handlers/formHandlers";
import CustomButton from "../../UI/CustomButton";

export default function LecturerForm({ formData, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    id: "",
    name: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData && formData.id) {
      setLocalForm(formData); // Editing existing
    } else {
      generateNextLecturerId(); // Creating new
    }
  }, [formData]);

  const generateNextLecturerId = () => {
    const existingLecturers = getRecords("lecturers") || [];
    const numbers = existingLecturers
      .map((lec) => parseInt(lec.id?.replace("L", ""), 10))
      .filter((n) => !isNaN(n));
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const nextId = `L${nextNumber}`;
    setLocalForm((prev) => ({ ...prev, id: nextId }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "id") return; // ID is never editable
    setLocalForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = async () => {
    const existingLecturers = getRecords("lecturers") || [];
    const actionType = formData?.id ? "edit" : "add";

    // If ID is missing during add — generate it
    if (!localForm.id && actionType === "add") {
      const numbers = existingLecturers
        .map((lec) => parseInt(lec.id?.replace("L", ""), 10))
        .filter((n) => !isNaN(n));
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      const nextId = `L${nextNumber}`;
      localForm.id = nextId;
    }

    const { success, errors } = await handleSaveOrUpdateRecord(
      "lecturers",
      localForm,
      actionType
    );

    if (!success) {
      setLocalErrors(errors || {});
      return;
    }

    if (onSave) onSave(localForm);
    onClose?.();
  };

  return (
    <Stack spacing={3}>
      {formData && formData.id && (
        <TextField
          label="Lecturer ID"
          name="id"
          value={localForm.id}
          fullWidth
          disabled
        />
      )}

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
