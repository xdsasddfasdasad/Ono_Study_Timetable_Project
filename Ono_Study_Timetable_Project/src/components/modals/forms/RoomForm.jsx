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
import { validateRoomForm } from "../../../utils/validateForm";
import { saveRecord } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function RoomForm({ formData, onChange, errors, onClose, onSave, options }) {
  const handleSubmit = () => {
    const validationErrors = validateRoomForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      if (onChange) onChange({ target: { name: "errors", value: validationErrors } });
      return;
    }

    saveRecord("rooms", formData);

    if (onSave) onSave(formData);

    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Room Code"
        name="roomCode"
        value={formData.roomCode}
        onChange={onChange}
        error={!!errors.roomCode}
        helperText={errors.roomCode}
        fullWidth
      />
      <TextField
        label="Room Name"
        name="roomName"
        value={formData.roomName}
        onChange={onChange}
        error={!!errors.roomName}
        helperText={errors.roomName}
        fullWidth
      />

      <FormControl fullWidth error={!!errors.siteCode}>
        <InputLabel>Site</InputLabel>
        <Select
          name="siteCode"
          value={formData.siteCode}
          onChange={onChange}
          label="Site"
        >
          {options?.sites?.map((site) => (
            <MenuItem key={site.code} value={site.code}>
              {site.name}
            </MenuItem>
          ))}
        </Select>
        {errors.siteCode && <Typography color="error">{errors.siteCode}</Typography>}
      </FormControl>

      <CustomButton onClick={handleSubmit}>Save Room</CustomButton>
    </Stack>
  );
}
