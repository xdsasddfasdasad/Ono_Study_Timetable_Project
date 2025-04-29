import React, { useState, useEffect } from "react";
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
import { getRecords, saveRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function RoomForm({ formData, onClose, onSave, options }) {
  const [localForm, setLocalForm] = useState({
    roomCode: "",
    roomName: "",
    siteCode: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) setLocalForm(formData);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = () => {
    const validationErrors = validateRoomForm(localForm);
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    const sites = getRecords("sites") || [];
    const siteIndex = sites.findIndex((s) => s.siteCode === localForm.siteCode);
    if (siteIndex === -1) {
      setLocalErrors({ siteCode: "Selected site not found" });
      return;
    }

    const site = sites[siteIndex];
    const existingRooms = site.rooms || [];
    const isEdit = existingRooms.some((r) => r.roomCode === localForm.roomCode);

    const updatedRooms = isEdit
      ? existingRooms.map((r) =>
          r.roomCode === localForm.roomCode ? localForm : r
        )
      : [...existingRooms, localForm];

    sites[siteIndex] = {
      ...site,
      rooms: updatedRooms,
    };

    saveRecords("sites", sites);
    if (onSave) onSave(localForm);
    setLocalForm({ roomCode: "", roomName: "", siteCode: "" });
    setLocalErrors({});
    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Room Code"
        name="roomCode"
        value={localForm.roomCode}
        onChange={handleChange}
        error={!!localErrors.roomCode}
        helperText={localErrors.roomCode}
        fullWidth
        disabled={!!formData?.roomCode} // disable in edit mode
      />
      <TextField
        label="Room Name"
        name="roomName"
        value={localForm.roomName}
        onChange={handleChange}
        error={!!localErrors.roomName}
        helperText={localErrors.roomName}
        fullWidth
      />

      <FormControl fullWidth error={!!localErrors.siteCode}>
        <InputLabel>Site</InputLabel>
        <Select
          name="siteCode"
          value={localForm.siteCode}
          onChange={handleChange}
          label="Site"
        >
          {options?.sites?.map((site) => (
            <MenuItem key={site.siteCode} value={site.siteCode}>
              {site.siteName}
            </MenuItem>
          ))}
        </Select>
        {localErrors.siteCode && (
          <Typography color="error" variant="caption">
            {localErrors.siteCode}
          </Typography>
        )}
      </FormControl>

      <CustomButton onClick={handleSubmit}>
        {formData?.roomCode ? "Update Room" : "Save Room"}
      </CustomButton>
    </Stack>
  );
}
