// src/components/modals/TimeTableCalendarManageModal.jsx

import React, { useState, useEffect } from "react";
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import { getRecords } from "../../utils/storage";
import { handleSaveOrUpdateRecord } from "../../handlers/formHandlers";

export default function TimeTableCalendarManageModal({
  open,
  onClose,
  onSave,
  selectedEvent,
  defaultDate,
  recordType,
  manageEntitiesOpen,
  setManageEntitiesOpen,
}) {
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [entityRecords, setEntityRecords] = useState([]);
  const [selectedEntityRecord, setSelectedEntityRecord] = useState(null);
  const [localForm, setLocalForm] = useState({});
  const [entityErrors, setEntityErrors] = useState({});

  useEffect(() => {
    if (selectedEntityType) {
      const records = getRecords(selectedEntityType) || [];
      setEntityRecords(records);
      setSelectedEntityRecord(null);
      setLocalForm({});
      setEntityErrors({});
    }
  }, [selectedEntityType]);

  const handleEntityTypeChange = (e) => {
    setSelectedEntityType(e.target.value);
  };

  const handleEntitySelect = (e) => {
    const selectedId = e.target.value;
    const record = entityRecords.find(
      (rec) =>
        rec.id === selectedId ||
        rec.roomCode === selectedId ||
        rec.siteCode === selectedId
    );
    if (record) {
      setSelectedEntityRecord(record);
      setLocalForm(record);
    }
  };

  const handleEntityFieldChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
    setEntityErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSaveEntity = async () => {
    if (!selectedEntityType || !localForm) return;

    const { success, errors } = await handleSaveOrUpdateRecord(
      selectedEntityType,
      localForm,
      "edit"
    );

    if (success) {
      setManageEntitiesOpen(false);
    } else {
      setEntityErrors(errors || {});
    }
  };

  return (
    <>
      {selectedEvent ? (
        <TimeTableEditModal
          open={open}
          onClose={onClose}
          onSave={onSave}
          selectedEvent={selectedEvent}
          recordType={recordType}
        />
      ) : (
        <TimeTableAddModal
          open={open}
          onClose={onClose}
          onSave={onSave}
          defaultDate={defaultDate}
        />
      )}

      <Dialog
        open={manageEntitiesOpen}
        onClose={() => setManageEntitiesOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Entities</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Select
              value={selectedEntityType}
              onChange={handleEntityTypeChange}
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select Entity Type
              </MenuItem>
              <MenuItem value="lecturers">Lecturers</MenuItem>
              <MenuItem value="rooms">Rooms</MenuItem>
              <MenuItem value="sites">Sites</MenuItem>
              {/* You can add more types here as needed */}
            </Select>

            {selectedEntityType && (
              <Select
                value={
                  selectedEntityRecord?.id ||
                  selectedEntityRecord?.roomCode ||
                  selectedEntityRecord?.siteCode ||
                  ""
                }
                onChange={handleEntitySelect}
                fullWidth
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Select Specific Record
                </MenuItem>
                {entityRecords.map((rec) => (
                  <MenuItem
                    key={rec.id || rec.roomCode || rec.siteCode}
                    value={rec.id || rec.roomCode || rec.siteCode}
                  >
                    {rec.name || rec.roomName || rec.siteName}
                  </MenuItem>
                ))}
              </Select>
            )}

            {selectedEntityRecord && (
              <>
                {Object.keys(localForm).map(
                  (field) =>
                    field !== "id" &&
                    field !== "siteCode" &&
                    field !== "roomCode" && (
                      <TextField
                        key={field}
                        name={field}
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        value={localForm[field] || ""}
                        onChange={handleEntityFieldChange}
                        error={!!entityErrors[field]}
                        helperText={entityErrors[field] || ""}
                        fullWidth
                      />
                    )
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageEntitiesOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSaveEntity}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
