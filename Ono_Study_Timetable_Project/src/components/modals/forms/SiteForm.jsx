// src/components/modals/forms/SiteForm.jsx

import React from "react";
import { TextField, Stack, Typography } from "@mui/material";

export default function SiteForm({ formData = {}, onChange, errors = {}, mode = "add" }) {
  return (
      <Stack spacing={2}>
        {errors.general && (
        <Typography color="error" variant="body2">
          {errors.general}
        </Typography>
        )}
      {/* Site Code - Always disabled */}
      <TextField
        label="Site Code"
        name="siteCode"
        value={formData.siteCode || ""}
        onChange={onChange}
        error={!!errors.siteCode}
        helperText={errors.siteCode}
        fullWidth
        disabled
      />

      {/* Site Name */}
      <TextField
        label="Site Name"
        name="siteName"
        value={formData.siteName || ""}
        onChange={onChange}
        error={!!errors.siteName}
        helperText={errors.siteName}
        fullWidth
      />

      {/* Notes */}
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
