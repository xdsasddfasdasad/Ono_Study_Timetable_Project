import React from "react";
import { TextField, Stack, Box, Typography } from "@mui/material";

export default function YearForm({ formData = {}, errors = {}, onChange, mode = "add" }) {
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
            value={formData.yearNumber || ""}
            onChange={onChange}
            error={!!errors.yearNumber}
            helperText={errors.yearNumber}
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
            value={formData.startDate || ""}
            onChange={onChange}
            error={!!errors.startDate}
            helperText={errors.startDate}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate || ""}
            onChange={onChange}
            error={!!errors.endDate}
            helperText={errors.endDate}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </Box>
    </Stack>
  );
}
