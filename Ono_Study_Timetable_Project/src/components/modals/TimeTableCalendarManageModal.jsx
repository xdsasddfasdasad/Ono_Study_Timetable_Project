// src/components/modals/TimeTableCalendarManageModal.jsx

// --- Imports ---
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Select, MenuItem, TextField, Button, FormControl, InputLabel, Alert, Typography,
  CircularProgress, Box
} from "@mui/material";

import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";

import { getRecords } from "../../utils/storage";

import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers";

const MANAGED_ENTITIES = {
  lecturers: { key: "id", display: "name", label: "Lecturer" },
  rooms: { key: "roomCode", display: "roomName", label: "Room" },
  sites: { key: "siteCode", display: "siteName", label: "Site" },
};
export default function TimeTableCalendarManageModal({
  open,
  onClose,
  onSave,
  initialData,
  recordType,
  defaultDate,
  manageEntitiesOpen,
  setManageEntitiesOpen,
}) {


  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [entityRecords, setEntityRecords] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [entityFormData, setEntityFormData] = useState(null);
  const [entityErrors, setEntityErrors] = useState({});
  const [entitySaveError, setEntitySaveError] = useState("");
  const [isDeletingEntity, setIsDeletingEntity] = useState(false);
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  useEffect(() => {
    if (manageEntitiesOpen && selectedEntityType) {
      console.log(`[ManageModal] Loading records for: ${selectedEntityType}`);
      setIsSavingEntity(false); setIsDeletingEntity(false);
      setEntitySaveError(""); setEntityErrors({});
      try {
        const records = getRecords(selectedEntityType) || [];
        setEntityRecords(records);
      } catch (error) {
        console.error(`[ManageModal] Failed loading ${selectedEntityType}:`, error);
        setEntityRecords([]); setEntitySaveError(`Failed to load ${selectedEntityType}.`);
      }
      setSelectedEntityId(""); setEntityFormData(null);
    }

    if (!manageEntitiesOpen || !selectedEntityType) {
      setSelectedEntityType(""); setEntityRecords([]); setSelectedEntityId("");
      setEntityFormData(null); setEntityErrors({}); setEntitySaveError("");
      setIsSavingEntity(false); setIsDeletingEntity(false);
    }
  }, [manageEntitiesOpen, selectedEntityType]);

  const handleEntityTypeChange = useCallback((e) => setSelectedEntityType(e.target.value), []);

  const handleEntitySelectChange = useCallback((e) => {
    const id = e.target.value;
    setSelectedEntityId(id);
    setEntitySaveError(""); setEntityErrors({}); setIsDeletingEntity(false);
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) return;
    const record = entityRecords.find(rec => rec[config.key] === id);

    setEntityFormData(record ? { ...record } : null);
  }, [entityRecords, selectedEntityType]);

  const handleEntityFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEntityFormData(prev => prev ? { ...prev, [name]: value } : null);
    setEntityErrors(prev => ({ ...prev, [name]: undefined }));
    setEntitySaveError("");
  }, []);

  const handleSaveEntity = useCallback(async () => {
    setEntitySaveError(""); setEntityErrors({});
    if (!selectedEntityType || !entityFormData || isDeletingEntity || isSavingEntity) return;
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) { setEntitySaveError("Invalid entity configuration."); return; }

    setIsSavingEntity(true);

    const entityKeyForHandler = selectedEntityType === 'rooms' ? 'sites' : selectedEntityType;
    const dataForHandler = { ...entityFormData };
    const validationExtraForHandler = { editingId: selectedEntityId, recordType: selectedEntityType };
    if (selectedEntityType === 'rooms') {
        validationExtraForHandler.parentRecord = (getRecords('sites') || []).find(s => s.siteCode === dataForHandler.siteCode);
        if (!validationExtraForHandler.parentRecord) {
            setIsSavingEntity(false); setEntitySaveError("Parent site not found for room."); return;
        }
        validationExtraForHandler.existingRooms = (validationExtraForHandler.parentRecord.rooms || []).filter(r => r.roomCode !== selectedEntityId);
    } else if (selectedEntityType === 'sites' || selectedEntityType === 'lecturers') {
        const key = `existing${selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}`;
        validationExtraForHandler[key] = (getRecords(selectedEntityType) || []).filter(rec => rec[config.key] !== selectedEntityId);
    }

    console.log(`[ManageModal:Save] Type: ${selectedEntityType}, HandlerKey: ${entityKeyForHandler}, ID: ${selectedEntityId}`);

    const result = await handleSaveOrUpdateRecord(entityKeyForHandler, dataForHandler, "edit", validationExtraForHandler);
    setIsSavingEntity(false);

    if (result.success) {
      console.log(`[ManageModal:Save] Success.`);
      setManageEntitiesOpen(false);
      onSave();
    } else {
      console.error(`[ManageModal:Save] Failed:`, result.message, result.errors);
      setEntityErrors(result.errors || {});
      setEntitySaveError(result.message || `Failed to save ${config.label}.`);
    }
  }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isDeletingEntity, isSavingEntity]);

  const handleDeleteEntity = useCallback(() => {
    setEntitySaveError(""); setEntityErrors({});
    if (!selectedEntityType || !entityFormData || !selectedEntityId || isSavingEntity || isDeletingEntity) return;
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) { setEntitySaveError("Invalid entity configuration."); return; }

    const recordIdToDelete = selectedEntityId;
    const recordLabel = entityFormData[config.display] || recordIdToDelete;

    if (!window.confirm(`DELETE ${config.label}:\n"${recordLabel}" (${recordIdToDelete})\n\nAre you sure? This action cannot be undone and might affect related data.`)) {
      return;
    }

    setIsDeletingEntity(true); setEntitySaveError("");

    let entityKeyForHandler = selectedEntityType;
    let parentId = null;
    if (selectedEntityType === 'rooms') {
        entityKeyForHandler = 'sites';
        parentId = entityFormData.siteCode;
        if (!parentId) {
            console.error("[ManageModal:Delete] Cannot delete room: Parent Site ID (siteCode) missing.");
            setEntitySaveError("Cannot delete room: Parent Site ID missing."); setIsDeletingEntity(false); return;
        }
    }

    console.log(`[ManageModal:Delete] Type: ${selectedEntityType}, HandlerKey: ${entityKeyForHandler}, ID: ${recordIdToDelete}, ParentID: ${parentId}`);

    handleDeleteEntityFormSubmit(
      entityKeyForHandler,
      recordIdToDelete,
      (successMessage) => {
        console.log(`[ManageModal:Delete] Success:`, successMessage);
        setIsDeletingEntity(false); setManageEntitiesOpen(false);
        onSave();
        alert(successMessage || `${config.label} deleted successfully.`);
      },
      (errorMessage) => {
        console.error(`[ManageModal:Delete] Failed:`, errorMessage);
        setIsDeletingEntity(false);
        setEntitySaveError(errorMessage || `Failed to delete ${config.label}.`);
      },
      parentId 
    );
  }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isSavingEntity]);


  return (
    <>
      {initialData ? (
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
      )}
      <Dialog
        open={manageEntitiesOpen}
        onClose={() => !isDeletingEntity && !isSavingEntity && setManageEntitiesOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="manage-entities-dialog-title"
      >
        <DialogTitle id="manage-entities-dialog-title">Manage Basic Entities</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
             <FormControl fullWidth error={!selectedEntityType && !!entitySaveError} disabled={isDeletingEntity || isSavingEntity}>
                 <InputLabel id="manage-entity-type-label">Select Entity Type</InputLabel>
                 <Select labelId="manage-entity-type-label" label="Select Entity Type" value={selectedEntityType} onChange={handleEntityTypeChange}>
                     {Object.entries(MANAGED_ENTITIES).map(([key, config]) => (<MenuItem key={key} value={key}>{config.label}</MenuItem>))}
                 </Select>
             </FormControl>
             {selectedEntityType && (
                 <FormControl fullWidth error={!selectedEntityId && !!entitySaveError && entityRecords.length > 0} disabled={isDeletingEntity || isSavingEntity || entityRecords.length === 0}>
                      <InputLabel id="manage-entity-record-label">Select Record to Edit/Delete</InputLabel>
                      <Select labelId="manage-entity-record-label" label="Select Record to Edit/Delete" value={selectedEntityId} onChange={handleEntitySelectChange} >
                           {entityRecords.length === 0 && <MenuItem value="" disabled>No records found for {MANAGED_ENTITIES[selectedEntityType]?.label || 'selection'}</MenuItem>}
                           {entityRecords.map((rec) => { const config = MANAGED_ENTITIES[selectedEntityType]; const k = rec[config.key]; const d = rec[config.display]; return (<MenuItem key={k} value={k}>{d} ({config.key}: {k})</MenuItem> ); })}
                      </Select>
                 </FormControl>
             )}
             {entityFormData && (
                 <Stack spacing={2} border={1} borderColor="divider" borderRadius={1} p={2}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Edit Details:</Typography>
                      {Object.entries(entityFormData).map(([field, value]) => {
                           const config = MANAGED_ENTITIES[selectedEntityType];
                           if (field === config?.key || (selectedEntityType === 'rooms' && field === 'siteCode')) return null;
                           if (Array.isArray(value)) return null;

                           return (
                               <TextField
                                   key={field}
                                   name={field}
                                   label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                   value={value || ""}
                                   onChange={handleEntityFieldChange}
                                   error={!!entityErrors[field]}
                                   helperText={entityErrors[field] || ""}
                                   fullWidth variant="outlined" size="small"
                                   disabled={isDeletingEntity || isSavingEntity}
                                />
                           );
                        })}
                 </Stack>
             )}
             {entitySaveError && <Alert severity="error" sx={{ mt: 1 }}>{entitySaveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', justifyContent: 'space-between' }}>
            <Box>
               {entityFormData && (
                   <Button color="error" variant="outlined" onClick={handleDeleteEntity} disabled={isDeletingEntity || isSavingEntity} startIcon={isDeletingEntity ? <CircularProgress size={18} color="inherit"/> : null} >
                       {isDeletingEntity ? "Deleting..." : "Delete"} {MANAGED_ENTITIES[selectedEntityType]?.label || ''}
                   </Button>
               )}
           </Box>
           <Stack direction="row" spacing={1}>
                <Button onClick={() => !isDeletingEntity && !isSavingEntity && setManageEntitiesOpen(false)} disabled={isDeletingEntity || isSavingEntity}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={handleSaveEntity} disabled={!entityFormData || Object.values(entityErrors).some(e => !!e) || isDeletingEntity || isSavingEntity} startIcon={isSavingEntity ? <CircularProgress size={18} color="inherit"/> : null} >
                    {isSavingEntity ? "Saving..." : "Save Changes"}
                </Button>
           </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}