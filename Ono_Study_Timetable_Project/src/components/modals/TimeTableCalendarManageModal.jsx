// src/components/modals/TimeTableCalendarManageModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Select, MenuItem, TextField, Button, FormControl, InputLabel, Alert, Typography,
  CircularProgress, Box, Divider
} from "@mui/material";
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";
// --- FIX 1: Import the new handlers and necessary Firestore functions ---
import { handleSaveOrUpdateRecord, handleDeleteEntity } from "../../handlers/formHandlers";
import { fetchCollection, fetchAllRooms } from "../../firebase/firestoreService";
import { formMappings } from "../../utils/formMappings";

// Entities that can be edited in the 'Manage Basic Entities' dialog
const MANAGED_ENTITIES = {
  lecturers: "Lecturer",
  sites: "Site",
  rooms: "Room", // Rooms are special as they are nested
};

export default function TimeTableCalendarManageModal({
  open, onClose, onSave, // onSave is the global refresh function
  initialData,    // The event object to edit
  recordType,     // The type of event to edit
  defaultDate,    // The date clicked for adding
  manageEntitiesOpen, setManageEntitiesOpen, // State for the secondary dialog
}) {

  // State for the "Manage Basic Entities" dialog
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [entityRecords, setEntityRecords] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [entityFormData, setEntityFormData] = useState(null);
  const [entityErrors, setEntityErrors] = useState({});
  const [entityApiError, setEntityApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Effect to load records for the selected entity type ---
  useEffect(() => {
    if (manageEntitiesOpen && selectedEntityType) {
      const loadRecords = async () => {
        setIsLoading(true); setEntityRecords([]); setEntityFormData(null); setSelectedEntityId("");
        try {
          const records = selectedEntityType === 'rooms'
            ? await fetchAllRooms()
            : await fetchCollection(selectedEntityType);
          setEntityRecords(records);
        } catch (error) {
          setEntityApiError(`Failed to load ${MANAGED_ENTITIES[selectedEntityType]}.`);
        } finally {
          setIsLoading(false);
        }
      };
      loadRecords();
    }
  }, [manageEntitiesOpen, selectedEntityType]);

  // --- Handlers for the "Manage Basic Entities" dialog ---
  const handleEntitySelectChange = (e) => {
    const id = e.target.value;
    setSelectedEntityId(id);
    const record = entityRecords.find(rec => rec[formMappings[selectedEntityType]?.primaryKey] === id);
    setEntityFormData(record ? { ...record } : null);
    setEntityErrors({}); setEntityApiError("");
  };

  const handleEntityFieldChange = (e) => {
    const { name, value } = e.target;
    setEntityFormData(prev => prev ? { ...prev, [name]: value } : null);
    if(entityErrors[name]) setEntityErrors(prev => ({...prev, [name]: undefined}));
  };

  const handleSaveEntity = async () => {
    if (!selectedEntityType || !entityFormData) return;
    setIsLoading(true);

    const mapping = formMappings[selectedEntityType];
    const result = await handleSaveOrUpdateRecord(
      mapping.collectionName,
      entityFormData,
      "edit",
      { recordType: selectedEntityType, editingId: selectedEntityId }
    );
    setIsLoading(false);

    if (result.success) {
      setManageEntitiesOpen(false);
      onSave(); // Refresh data globally
    } else {
      setEntityErrors(result.errors || {});
      setEntityApiError(result.message || "Failed to save.");
    }
  };

  const handleDeleteEntityClick = async () => {
    if (!selectedEntityType || !entityFormData) return;
    
    const mapping = formMappings[selectedEntityType];
    const recordId = entityFormData[mapping.primaryKey];
    if (!window.confirm(`Are you sure you want to delete this ${mapping.label}?`)) return;

    setIsLoading(true);
    const options = { parentDocId: entityFormData.siteCode }; // For rooms
    const result = await handleDeleteEntity(mapping.collectionName, recordId, options);
    setIsLoading(false);
    
    if (result.success) {
      setManageEntitiesOpen(false);
      onSave();
    } else {
      setEntityApiError(result.message || "Deletion failed.");
    }
  };

  // --- Main Render Logic ---

  // If initialData is provided, it means we are EDITING an existing event.
  // If not, we are ADDING a new event.
  // This modal acts as a "controller" for the two generic modals.
  if (!manageEntitiesOpen) {
    return initialData ? (
      <TimeTableEditModal
        open={open}
        onClose={onClose}
        onSave={onSave}
        initialData={initialData}
        recordType={recordType}
      />
    ) : (
      <TimeTableAddModal
        open={open}
        onClose={onClose}
        onSave={onSave}
        defaultDate={defaultDate}
      />
    );
  }

  // Render the "Manage Basic Entities" dialog
  return (
    <Dialog open={manageEntitiesOpen} onClose={() => setManageEntitiesOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Basic Entities</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
           <FormControl fullWidth disabled={isLoading}>
               <InputLabel>Entity Type</InputLabel>
               <Select
                   label="Entity Type"
                   value={selectedEntityType}
                   onChange={(e) => setSelectedEntityType(e.target.value)}
               >
                   {Object.entries(MANAGED_ENTITIES).map(([key, label]) => (<MenuItem key={key} value={key}>{label}</MenuItem>))}
               </Select>
           </FormControl>

           {isLoading && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress/></Box>}

           {selectedEntityType && !isLoading && (
              <FormControl fullWidth>
                  <InputLabel>Select Record to Edit</InputLabel>
                  <Select label="Select Record to Edit" value={selectedEntityId} onChange={handleEntitySelectChange}>
                      {entityRecords.map((rec) => {
                          const mapping = formMappings[selectedEntityType];
                          const id = rec[mapping.primaryKey];
                          // Display logic needs to handle different entity structures
                          const name = rec.name || rec.siteName || rec.roomName || 'N/A';
                          return (<MenuItem key={id} value={id}>{`${name} (${id})`}</MenuItem>)
                      })}
                  </Select>
              </FormControl>
           )}

           {entityFormData && (
             <Stack spacing={2} border={1} borderColor="divider" borderRadius={1} p={2}>
                  <Typography variant="subtitle2">Edit Details</Typography>
                  <Divider />
                  {Object.keys(entityFormData).filter(key => !['id', 'rooms', 'semesters', 'siteCode', 'value', 'label'].includes(key)).map((field) => (
                    <TextField
                       key={field}
                       name={field}
                       label={field.charAt(0).toUpperCase() + field.slice(1)}
                       value={entityFormData[field] || ""}
                       onChange={handleEntityFieldChange}
                       error={!!entityErrors[field]}
                       helperText={entityErrors[field]}
                       fullWidth
                       variant="outlined"
                       size="small"
                     />
                  ))}
             </Stack>
           )}

           {entityApiError && <Alert severity="error">{entityApiError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px', justifyContent: 'space-between' }}>
          <Box>
             {entityFormData && (<Button color="error" onClick={handleDeleteEntityClick} disabled={isLoading}>Delete</Button>)}
          </Box>
          <Stack direction="row" spacing={1}>
              <Button onClick={() => setManageEntitiesOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveEntity} disabled={!entityFormData || isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
              </Button>
          </Stack>
      </DialogActions>
    </Dialog>
  );
}