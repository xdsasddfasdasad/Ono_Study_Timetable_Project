import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Select, MenuItem, TextField, Button, FormControl, InputLabel, Alert, Typography,
  CircularProgress, Box
} from "@mui/material";
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";
import {
    fetchCollection, updateDocument, deleteDocument,
    saveRoomInSite, deleteRoomFromSite, fetchAllRooms // Import Firestore functions
} from "../../firebase/firestoreService"; // Adjust path if needed

const MANAGED_ENTITIES = {
  lecturers: { key: "id", display: "name", label: "Lecturer" },
  rooms: { key: "roomCode", display: "roomName", label: "Room" },
  sites: { key: "siteCode", display: "siteName", label: "Site" },
};

export default function TimeTableCalendarManageModal({
  open, onClose, onSave, initialData, recordType, defaultDate,
  manageEntitiesOpen, setManageEntitiesOpen,
}) {
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [entityRecords, setEntityRecords] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [entityFormData, setEntityFormData] = useState(null);
  const [entityErrors, setEntityErrors] = useState({});
  const [entitySaveError, setEntitySaveError] = useState("");
  const [isDeletingEntity, setIsDeletingEntity] = useState(false);
  const [isSavingEntity, setIsSavingEntity] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  useEffect(() => {
    if (manageEntitiesOpen && selectedEntityType) {
      const loadRecordsAsync = async () => {
        setIsLoadingRecords(true);
        setIsSavingEntity(false); setIsDeletingEntity(false);
        setEntitySaveError(""); setEntityErrors({});
        setSelectedEntityId(""); setEntityFormData(null);
        setEntityRecords([]);
        try {
          let records = [];
          if (selectedEntityType === 'rooms') {
             // Fetch all rooms using the dedicated service function
             records = await fetchAllRooms();
             // We add siteName to the room records in fetchAllRooms for display
             // Need to ensure the data structure matches what the select expects
             // Let's reformat here for consistency if fetchAllRooms doesn't do it
              records = records.map(r => ({
                   ...r, // Keep all room data
                   // Ensure value/label exist for the Select component
                   value: r.roomCode,
                   label: `${r.roomName || r.roomCode} @ ${r.siteName || r.siteCode}`
              }));
          } else {
             records = await fetchCollection(selectedEntityType);
             // Reformat top-level records too for consistency in Select
              const config = MANAGED_ENTITIES[selectedEntityType];
              if (config) {
                   records = records.map(rec => ({
                        ...rec,
                        value: rec[config.key],
                        label: `${rec[config.display]} (${config.key}: ${rec[config.key]})`
                   }));
              }
          }
          setEntityRecords(records);
        } catch (error) {
          console.error(`[ManageModal] Failed loading ${selectedEntityType}:`, error);
          setEntityRecords([]);
          setEntitySaveError(`Failed to load ${MANAGED_ENTITIES[selectedEntityType]?.label || selectedEntityType}.`);
        } finally {
          setIsLoadingRecords(false);
        }
      };
      loadRecordsAsync();
    }
    if (!manageEntitiesOpen || !selectedEntityType) {
      setSelectedEntityType(""); setEntityRecords([]); setSelectedEntityId("");
      setEntityFormData(null); setEntityErrors({}); setEntitySaveError("");
      setIsSavingEntity(false); setIsDeletingEntity(false); setIsLoadingRecords(false);
    }
  }, [manageEntitiesOpen, selectedEntityType]);

  const handleEntityTypeChange = useCallback((e) => setSelectedEntityType(e.target.value), []);

  const handleEntitySelectChange = useCallback((e) => {
    const id = e.target.value;
    setSelectedEntityId(id);
    setEntitySaveError(""); setEntityErrors({}); setIsDeletingEntity(false);
    const config = MANAGED_ENTITIES[selectedEntityType]; if (!config) return;
    // Find the original record data (not just value/label)
    const record = entityRecords.find(rec => rec[config.key] === id);
    setEntityFormData(record ? { ...record } : null); // Set full data for the form
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
    const config = MANAGED_ENTITIES[selectedEntityType]; if (!config) { setEntitySaveError("Invalid config."); return; }

    setIsSavingEntity(true);
    const recordId = selectedEntityId;
    const dataToSave = { ...entityFormData }; // Data from form state

    try {
        let savePromise;
        if (selectedEntityType === 'rooms') {
            const siteId = dataToSave.siteCode;
            if (!siteId) throw new Error("Parent Site ID (siteCode) missing in room data for save.");
            // Prepare only room-specific fields for saving within the site document
            const roomDataOnly = { roomCode: recordId, roomName: dataToSave.roomName || "", notes: dataToSave.notes || "" };
            savePromise = saveRoomInSite(siteId, roomDataOnly);
        } else if (selectedEntityType === 'sites' || selectedEntityType === 'lecturers') {
             // Remove fields not meant for direct update or the ID itself
             const idField = config.key;
             delete dataToSave[idField];
             delete dataToSave.value; // Remove helper fields if they exist
             delete dataToSave.label;
             if(selectedEntityType === 'sites') delete dataToSave.rooms; // Don't overwrite nested rooms here

             savePromise = updateDocument(selectedEntityType, recordId, dataToSave);
        } else { throw new Error(`Saving for ${selectedEntityType} not implemented.`); }

        await savePromise;
        console.log(`[ManageModal:Save] Entity (${selectedEntityType}) saved successfully.`);
        setManageEntitiesOpen(false); onSave();
    } catch (error) {
        console.error(`[ManageModal:Save] Failed:`, error);
        setEntitySaveError(error.message || `Failed to save ${config.label}.`);
        setEntityErrors({});
    } finally { setIsSavingEntity(false); }
  }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isDeletingEntity, isSavingEntity]);

    const handleDeleteEntity = useCallback(async () => {
        setEntitySaveError(""); setEntityErrors({});
        if (!selectedEntityType || !entityFormData || !selectedEntityId || isSavingEntity || isDeletingEntity) return;
        const config = MANAGED_ENTITIES[selectedEntityType]; if (!config) { setEntitySaveError("Invalid config."); return; }

        const recordIdToDelete = selectedEntityId;
        const recordLabel = entityFormData[config.display] || recordIdToDelete;
        if (!window.confirm(`DELETE ${config.label}:\n"${recordLabel}" (${recordIdToDelete})\n\nAre you sure? This cannot be undone.`)) return;

        setIsDeletingEntity(true); setEntitySaveError("");

        try {
            let deletePromise;
            let parentId = null;

            if (selectedEntityType === 'rooms') {
                parentId = entityFormData.siteCode;
                if (!parentId) throw new Error("Parent Site ID (siteCode) missing for room deletion.");
                // Delete room from within the site document
                deletePromise = deleteRoomFromSite(parentId, recordIdToDelete);
            } else if (selectedEntityType === 'sites' || selectedEntityType === 'lecturers') {
                // Delete the top-level document
                deletePromise = deleteDocument(selectedEntityType, recordIdToDelete);
            } else { throw new Error(`Deletion for ${selectedEntityType} not implemented.`); }

            await deletePromise;
            console.log(`[ManageModal:Delete] Success: ${config.label} deleted.`);
            setManageEntitiesOpen(false); onSave();
            alert(`${config.label} deleted successfully.`);
        } catch (error) {
            console.error(`[ManageModal:Delete] Failed:`, error);
            setEntitySaveError(error.message || `Failed to delete ${config.label}.`);
        } finally { setIsDeletingEntity(false); }
    }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isSavingEntity, isDeletingEntity]);

  return (
    <>
      {initialData ? ( <TimeTableEditModal open={open} onClose={onClose} onSave={onSave} initialData={initialData} recordType={recordType} /> )
                   : ( <TimeTableAddModal open={open} onClose={onClose} onSave={onSave} defaultDate={defaultDate} /> )}

      <Dialog open={manageEntitiesOpen} onClose={() => !isDeletingEntity && !isSavingEntity && setManageEntitiesOpen(false)} maxWidth="sm" fullWidth aria-labelledby="manage-entities-dialog-title">
        <DialogTitle id="manage-entities-dialog-title">Manage Basic Entities</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
             <FormControl fullWidth error={!selectedEntityType && !!entitySaveError} disabled={isDeletingEntity || isSavingEntity || isLoadingRecords}>
                 <InputLabel id="manage-entity-type-label">Select Entity Type</InputLabel>
                 <Select labelId="manage-entity-type-label" label="Select Entity Type" value={selectedEntityType} onChange={handleEntityTypeChange}>
                     {Object.entries(MANAGED_ENTITIES).map(([key, config]) => (<MenuItem key={key} value={key}>{config.label}</MenuItem>))}
                 </Select>
             </FormControl>
             {selectedEntityType && (
                 <FormControl fullWidth error={!selectedEntityId && !!entitySaveError && entityRecords.length === 0 && !isLoadingRecords} disabled={isDeletingEntity || isSavingEntity || isLoadingRecords}>
                      <InputLabel id="manage-entity-record-label">Select Record to Edit/Delete</InputLabel>
                      <Select labelId="manage-entity-record-label" label="Select Record to Edit/Delete" value={selectedEntityId} onChange={handleEntitySelectChange} >
                           {isLoadingRecords && <MenuItem value="" disabled><em>Loading records...</em></MenuItem>}
                           {!isLoadingRecords && entityRecords.length === 0 && <MenuItem value="" disabled>No records found</MenuItem>}
                           {entityRecords.map((rec) => (<MenuItem key={rec.value || rec.id} value={rec.value || rec.id}>{rec.label || rec.name}</MenuItem> ))}
                      </Select>
                 </FormControl>
             )}
             {isLoadingRecords && <Box sx={{display: 'flex', justifyContent: 'center', my: 2}}><CircularProgress size={30} /></Box>}
             {entityFormData && !isLoadingRecords && (
                 <Stack spacing={2} border={1} borderColor="divider" borderRadius={1} p={2}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Edit Details:</Typography>
                      {Object.entries(entityFormData).map(([field, value]) => {
                           const config = MANAGED_ENTITIES[selectedEntityType];
                           if (field === config?.key || (selectedEntityType === 'rooms' && field === 'siteCode') || Array.isArray(value) || field === 'value' || field === 'label' || (selectedEntityType === 'rooms' && field === 'siteName')) return null;
                           return ( <TextField key={field} name={field} label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={value || ""} onChange={handleEntityFieldChange} error={!!entityErrors[field]} helperText={entityErrors[field] || ""} fullWidth variant="outlined" size="small" disabled={isDeletingEntity || isSavingEntity} /> );
                        })}
                 </Stack>
             )}
             {entitySaveError && !isLoadingRecords && <Alert severity="error" sx={{ mt: 1 }}>{entitySaveError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', justifyContent: 'space-between' }}>
            <Box>
               {entityFormData && ( <Button color="error" variant="outlined" onClick={handleDeleteEntity} disabled={isDeletingEntity || isSavingEntity} startIcon={isDeletingEntity ? <CircularProgress size={18} color="inherit"/> : null} > {isDeletingEntity ? "Deleting..." : "Delete"} {MANAGED_ENTITIES[selectedEntityType]?.label || ''} </Button> )}
           </Box>
           <Stack direction="row" spacing={1}>
                <Button onClick={() => !isDeletingEntity && !isSavingEntity && setManageEntitiesOpen(false)} disabled={isDeletingEntity || isSavingEntity}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={handleSaveEntity} disabled={!entityFormData || Object.values(entityErrors).some(e => !!e) || isDeletingEntity || isSavingEntity} startIcon={isSavingEntity ? <CircularProgress size={18} color="inherit"/> : null} > {isSavingEntity ? "Saving..." : "Save Changes"} </Button>
           </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}