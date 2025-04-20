import React from "react";
import { TextField, Stack } from "@mui/material";
import { validateSiteForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function SiteForm({ formData, onChange, errors, onClose, onSave }) {
  const handleSubmit = () => {
    const validationErrors = validateSiteForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("sites", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Site Code"
        name="siteCode"
        value={formData.siteCode}
        onChange={onChange}
        error={!!errors.siteCode}
        helperText={errors.siteCode}
        fullWidth
      />
      <TextField
        label="Site Name"
        name="siteName"
        value={formData.siteName}
        onChange={onChange}
        error={!!errors.siteName}
        helperText={errors.siteName}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>Save Site</CustomButton>
    </Stack>
  );
}
