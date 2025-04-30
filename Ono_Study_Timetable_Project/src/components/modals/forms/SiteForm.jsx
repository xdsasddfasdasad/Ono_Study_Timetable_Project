// src/components/modals/forms/SiteForm.jsx

import React from "react";
import { TextField, Stack } from "@mui/material";

export default function SiteForm({ formData = {}, onChange, errors = {}, mode = "add" }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Site Code"
        name="siteCode"
        value={formData.siteCode || ""}
        onChange={onChange}
        error={!!errors.siteCode}
        helperText={errors.siteCode}
        fullWidth
        disabled // always disabled – generated automatically
      />

      <TextField
        label="Site Name"
        name="siteName"
        value={formData.siteName || ""}
        onChange={onChange}
        error={!!errors.siteName}
        helperText={errors.siteName}
        fullWidth
      />

      <TextField
        label="Notes"
        name="notes"
        value={formData.notes || ""}
        onChange={onChange}
        error={!!errors.notes}
        helperText={errors.notes}
        fullWidth
        multiline
        minRows={2}
      />
    </Stack>
  );
}
