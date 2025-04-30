// src/components/modals/forms/RoomForm.jsx

import React, { useState, useEffect } from "react";
import { TextField, Stack, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { getRecords } from "../../../utils/storage";

export default function RoomForm({ formData = {}, errors = {}, onChange, mode = "add", options = {} }) {
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSiteCode, setSelectedSiteCode] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoomCode, setSelectedRoomCode] = useState("");

  useEffect(() => {
    const sites = options.sites || getRecords("sites") || [];
    setAvailableSites(sites);

    if (mode === "edit" && formData.siteCode) {
      setSelectedSiteCode(formData.siteCode);
    }
  }, [options.sites, mode, formData.siteCode]);

  useEffect(() => {
    if (selectedSiteCode) {
      const site = availableSites.find((s) => s.siteCode === selectedSiteCode);
      if (site) {
        setAvailableRooms(site.rooms || []);
      } else {
        setAvailableRooms([]);
      }
    }
  }, [selectedSiteCode, availableSites]);

  useEffect(() => {
    if (mode === "edit" && formData.roomCode) {
      setSelectedRoomCode(formData.roomCode);
    }
  }, [formData.roomCode, mode]);

  const handleSiteChange = (e) => {
    const value = e.target.value;
    setSelectedSiteCode(value);
    setSelectedRoomCode("");
    onChange({ target: { name: "siteCode", value } });
  };

  const handleRoomChange = (e) => {
    const value = e.target.value;
    setSelectedRoomCode(value);

    const room = availableRooms.find((r) => r.roomCode === value);
    if (room) {
      // Update form fields
      onChange({ target: { name: "roomCode", value: room.roomCode } });
      onChange({ target: { name: "roomName", value: room.roomName } });
      onChange({ target: { name: "notes", value: room.notes || "" } });
    }
  };

  useEffect(() => {
    if (mode === "add" && !formData.roomCode) {
      const allRooms = availableSites.flatMap((site) => site.rooms || []);
      const numbers = allRooms.map((r) => parseInt(r.roomCode?.replace("R", ""), 10)).filter((n) => !isNaN(n));
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      const nextRoomCode = `R${nextNumber}`;

      onChange({ target: { name: "roomCode", value: nextRoomCode } });
    }
  }, [availableSites, formData.roomCode, mode, onChange]);

  return (
    <Stack spacing={2}>
      {/* Select Site */}
      <FormControl fullWidth error={!!errors.siteCode}>
        <InputLabel>Site</InputLabel>
        <Select
          value={selectedSiteCode}
          onChange={handleSiteChange}
          disabled={mode === "edit"}
          label="Site"
        >
          {availableSites.map((site) => (
            <MenuItem key={site.siteCode} value={site.siteCode}>
              {site.siteName}
            </MenuItem>
          ))}
        </Select>
        {errors.siteCode && (
          <Typography color="error" variant="caption">{errors.siteCode}</Typography>
        )}
      </FormControl>

      {/* Select Room if editing */}
      {mode === "edit" && (
        <FormControl fullWidth error={!!errors.roomCode}>
          <InputLabel>Room</InputLabel>
          <Select
            value={selectedRoomCode}
            onChange={handleRoomChange}
            label="Room"
          >
            {availableRooms.map((room) => (
              <MenuItem key={room.roomCode} value={room.roomCode}>
                {room.roomName} ({room.roomCode})
              </MenuItem>
            ))}
          </Select>
          {errors.roomCode && (
            <Typography color="error" variant="caption">{errors.roomCode}</Typography>
          )}
        </FormControl>
      )}

      {/* Room Code (Always Disabled) */}
      <TextField
        label="Room Code"
        name="roomCode"
        value={formData.roomCode || ""}
        fullWidth
        disabled
      />

      {/* Room Name */}
      <TextField
        label="Room Name"
        name="roomName"
        value={formData.roomName || ""}
        onChange={onChange}
        error={!!errors.roomName}
        helperText={errors.roomName}
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
