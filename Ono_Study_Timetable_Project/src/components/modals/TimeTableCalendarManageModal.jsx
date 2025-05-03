// src/components/modals/TimeTableCalendarManageModal.jsx

// --- Imports ---
// React Hooks for state and lifecycle management
import React, { useState, useEffect, useCallback } from "react";
// Material UI components for building the dialog and form elements
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Select, MenuItem, TextField, Button, FormControl, InputLabel, Alert, Typography,
  CircularProgress, Box // Components for loading states and layout
} from "@mui/material";

// Child Modals that this component conditionally renders
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";

// Utility for accessing localStorage data
import { getRecords } from "../../utils/storage";

// Central handlers for saving/updating and deleting data via localStorage
import { handleSaveOrUpdateRecord, handleDeleteEntityFormSubmit } from "../../handlers/formHandlers";

// Configuration for entities managed by the nested dialog
// Defines the entity key, the primary key field, the display field, and a user-friendly label.
const MANAGED_ENTITIES = {
  lecturers: { key: "id", display: "name", label: "Lecturer" },
  // Note: 'rooms' operations here target the nested array within 'sites'
  rooms: { key: "roomCode", display: "roomName", label: "Room" },
  sites: { key: "siteCode", display: "siteName", label: "Site" },
  // Extendable: Add other simple, non-calendar entities here if needed
};

// --- Controller Modal Component ---
// This component acts as a router/controller. It decides whether to show
// the AddModal or EditModal based on `initialData`. It also contains
// the complete logic for the separate "Manage Entities" dialog.
export default function TimeTableCalendarManageModal({
  // --- Props from Parent (TimeTableManagementPage) ---

  // For controlling the main Add/Edit modal flow
  open,             // Boolean: Is the Add/Edit modal part supposed to be open?
  onClose,          // Function: Callback to signal the parent to close the Add/Edit flow.
  onSave,           // Function: Callback after ANY successful save/delete (triggers parent refresh).

  // Data determining Add vs. Edit mode and content
  initialData,      // Object | null: Data for editing. If null, AddModal is shown.
  recordType,       // String | null: Type hint for EditModal context (e.g., 'semester', 'event').
  defaultDate,      // String | null: Default date for AddModal when triggered by date click.

  // For controlling the nested "Manage Entities" dialog
  manageEntitiesOpen, // Boolean: Is the separate "Manage Entities" dialog open?
  setManageEntitiesOpen, // Function: Allows this component to open/close the entities dialog via parent state.
}) {

  // --- State Variables (Scoped to the "Manage Entities" dialog ONLY) ---
  const [selectedEntityType, setSelectedEntityType] = useState(""); // Key from MANAGED_ENTITIES (e.g., "lecturers")
  const [entityRecords, setEntityRecords] = useState([]); // Array of records fetched for the selected type
  const [selectedEntityId, setSelectedEntityId] = useState(""); // The ID (primary key value) of the selected record
  const [entityFormData, setEntityFormData] = useState(null); // Object holding the data of the selected entity for the form
  const [entityErrors, setEntityErrors] = useState({}); // Validation errors for the entity form fields { fieldName: errorMsg }
  const [entitySaveError, setEntitySaveError] = useState(""); // General error message for save/delete operations
  const [isDeletingEntity, setIsDeletingEntity] = useState(false); // Loading indicator for delete operation
  const [isSavingEntity, setIsSavingEntity] = useState(false); // Loading indicator for save operation

  // --- Effects for "Manage Entities" Dialog ---
  // Effect to load records when the entity type changes OR the dialog opens.
  // Also handles resetting state when dialog closes or type is deselected.
  useEffect(() => {
    // Load data only if the dialog is open AND an entity type is selected
    if (manageEntitiesOpen && selectedEntityType) {
      console.log(`[ManageModal] Loading records for: ${selectedEntityType}`);
      setIsSavingEntity(false); setIsDeletingEntity(false); // Reset loading indicators
      setEntitySaveError(""); setEntityErrors({}); // Clear previous errors
      try {
        // Fetch records using the selectedEntityType as the storage key
        const records = getRecords(selectedEntityType) || [];
        setEntityRecords(records);
      } catch (error) {
        console.error(`[ManageModal] Failed loading ${selectedEntityType}:`, error);
        setEntityRecords([]); setEntitySaveError(`Failed to load ${selectedEntityType}.`);
      }
      // Reset specific record selection when type changes
      setSelectedEntityId(""); setEntityFormData(null);
    }

    // Reset entire entity dialog state if it closes or no type is selected
    if (!manageEntitiesOpen || !selectedEntityType) {
      setSelectedEntityType(""); setEntityRecords([]); setSelectedEntityId("");
      setEntityFormData(null); setEntityErrors({}); setEntitySaveError("");
      setIsSavingEntity(false); setIsDeletingEntity(false);
    }
    // Dependencies ensure this runs when visibility or selected type changes
  }, [manageEntitiesOpen, selectedEntityType]);

  // --- Handlers for "Manage Entities" Dialog ---
  // Update the selected entity type state
  const handleEntityTypeChange = useCallback((e) => setSelectedEntityType(e.target.value), []);

  // Update state when a specific record is selected from the dropdown
  const handleEntitySelectChange = useCallback((e) => {
    const id = e.target.value;
    setSelectedEntityId(id);
    setEntitySaveError(""); setEntityErrors({}); setIsDeletingEntity(false); // Reset state/errors
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) return; // Should not happen if UI is correct
    // Find the full record object from the loaded list
    const record = entityRecords.find(rec => rec[config.key] === id);
    // Set the found record (or null) into the form data state
    setEntityFormData(record ? { ...record } : null);
  }, [entityRecords, selectedEntityType]); // Dependencies: needs records and type to find the object

  // Update the temporary form data state as the user types in the fields
  const handleEntityFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEntityFormData(prev => prev ? { ...prev, [name]: value } : null); // Update field in object
    setEntityErrors(prev => ({ ...prev, [name]: undefined })); // Clear validation error for this field
    setEntitySaveError(""); // Clear any general save error
  }, []); // No dependencies needed as it only uses event data and setState

  // Handle saving changes made in the entity edit form
  const handleSaveEntity = useCallback(async () => {
    setEntitySaveError(""); setEntityErrors({}); // Clear previous errors
    // Basic validation before proceeding
    if (!selectedEntityType || !entityFormData || isDeletingEntity || isSavingEntity) return;
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) { setEntitySaveError("Invalid entity configuration."); return; }

    setIsSavingEntity(true); // Set loading state

    // Determine the correct entityKey for the handler (handle nested rooms via 'sites')
    const entityKeyForHandler = selectedEntityType === 'rooms' ? 'sites' : selectedEntityType;
    // Prepare data and validation context
    const dataForHandler = { ...entityFormData };
    const validationExtraForHandler = { editingId: selectedEntityId, recordType: selectedEntityType };
    // Add parent context if saving a nested entity (needed for validation/handler logic)
    if (selectedEntityType === 'rooms') {
        validationExtraForHandler.parentRecord = (getRecords('sites') || []).find(s => s.siteCode === dataForHandler.siteCode);
        if (!validationExtraForHandler.parentRecord) {
            setIsSavingEntity(false); setEntitySaveError("Parent site not found for room."); return;
        }
        // Provide existing rooms *within that parent* for validation (excluding self)
        validationExtraForHandler.existingRooms = (validationExtraForHandler.parentRecord.rooms || []).filter(r => r.roomCode !== selectedEntityId);
    } else if (selectedEntityType === 'sites' || selectedEntityType === 'lecturers') {
        // For simple entities, provide existing records (excluding self)
        const key = `existing${selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}`;
        validationExtraForHandler[key] = (getRecords(selectedEntityType) || []).filter(rec => rec[config.key] !== selectedEntityId);
    }

    console.log(`[ManageModal:Save] Type: ${selectedEntityType}, HandlerKey: ${entityKeyForHandler}, ID: ${selectedEntityId}`);

    // Call the central handler (always 'edit' action for this dialog)
    const result = await handleSaveOrUpdateRecord(entityKeyForHandler, dataForHandler, "edit", validationExtraForHandler);
    setIsSavingEntity(false); // Unset loading state

    if (result.success) {
      console.log(`[ManageModal:Save] Success.`);
      setManageEntitiesOpen(false); // Close the entities dialog
      onSave(); // Trigger refresh callback passed from parent page
    } else {
      console.error(`[ManageModal:Save] Failed:`, result.message, result.errors);
      setEntityErrors(result.errors || {}); // Display field-specific validation errors
      setEntitySaveError(result.message || `Failed to save ${config.label}.`); // Display general error
    }
  }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isDeletingEntity, isSavingEntity]); // Include loading states in deps

  // Handle deleting the selected entity
  const handleDeleteEntity = useCallback(() => {
    setEntitySaveError(""); setEntityErrors({});
    // Basic validation before proceeding
    if (!selectedEntityType || !entityFormData || !selectedEntityId || isSavingEntity || isDeletingEntity) return;
    const config = MANAGED_ENTITIES[selectedEntityType];
    if (!config) { setEntitySaveError("Invalid entity configuration."); return; }

    const recordIdToDelete = selectedEntityId;
    const recordLabel = entityFormData[config.display] || recordIdToDelete; // Get a user-friendly name

    // Confirmation dialog
    if (!window.confirm(`DELETE ${config.label}:\n"${recordLabel}" (${recordIdToDelete})\n\nAre you sure? This action cannot be undone and might affect related data.`)) {
      return; // User cancelled
    }

    setIsDeletingEntity(true); setEntitySaveError(""); // Set loading state

    // Determine correct entityKey and parentId for the handler
    let entityKeyForHandler = selectedEntityType;
    let parentId = null;
    if (selectedEntityType === 'rooms') {
        entityKeyForHandler = 'sites'; // Rooms are deleted via the 'sites' handler
        parentId = entityFormData.siteCode; // Get the parent siteCode from the room's data
        if (!parentId) {
            console.error("[ManageModal:Delete] Cannot delete room: Parent Site ID (siteCode) missing.");
            setEntitySaveError("Cannot delete room: Parent Site ID missing."); setIsDeletingEntity(false); return;
        }
    }
    // Add logic here if deleting other nested types managed by this dialog

    console.log(`[ManageModal:Delete] Type: ${selectedEntityType}, HandlerKey: ${entityKeyForHandler}, ID: ${recordIdToDelete}, ParentID: ${parentId}`);

    // Call the central delete handler
    handleDeleteEntityFormSubmit(
      entityKeyForHandler, // Correct key ('sites' for rooms)
      recordIdToDelete,   // ID of the item to delete
      (successMessage) => { // onSuccess Callback
        console.log(`[ManageModal:Delete] Success:`, successMessage);
        setIsDeletingEntity(false); setManageEntitiesOpen(false); // Close dialog
        onSave(); // Trigger parent refresh
        alert(successMessage || `${config.label} deleted successfully.`); // User feedback
      },
      (errorMessage) => { // onError Callback
        console.error(`[ManageModal:Delete] Failed:`, errorMessage);
        setIsDeletingEntity(false); // Unset loading
        setEntitySaveError(errorMessage || `Failed to delete ${config.label}.`); // Show error
      },
      parentId // Pass parentId (null for non-nested, siteCode for rooms)
    );
  }, [selectedEntityType, entityFormData, selectedEntityId, setManageEntitiesOpen, onSave, isSavingEntity]); // Include isSavingEntity dependency


  // --- Render Logic ---
  return (
    <>
      {/* --- Section 1: Render Add OR Edit Modal --- */}
      {/* This component delegates the actual Add/Edit form UI to child modals */}
      {/* It passes down the necessary props to control visibility and data flow */}
      {initialData ? (
        // Render EditModal when initialData (data to edit) is provided
        <TimeTableEditModal
          open={open}                // Controls visibility
          onClose={onClose}          // Parent's close handler
          onSave={onSave}            // Parent's refresh handler
          initialData={initialData}  // Data to populate the form
          recordType={recordType}    // Type hint for the form
        />
      ) : (
        // Render AddModal when initialData is null
        <TimeTableAddModal
          open={open}                // Controls visibility
          onClose={onClose}          // Parent's close handler
          onSave={onSave}            // Parent's refresh handler
          defaultDate={defaultDate}    // Default date for the form
        />
      )}

      {/* --- Section 2: Render the SEPARATE Dialog for "Manage Entities" --- */}
      {/* This dialog is controlled independently by manageEntitiesOpen */}
      <Dialog
        open={manageEntitiesOpen}
        // Prevent closing via backdrop click while saving/deleting
        onClose={() => !isDeletingEntity && !isSavingEntity && setManageEntitiesOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="manage-entities-dialog-title"
      >
        <DialogTitle id="manage-entities-dialog-title">Manage Basic Entities</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
             {/* Entity Type Selection Dropdown */}
             <FormControl fullWidth error={!selectedEntityType && !!entitySaveError} disabled={isDeletingEntity || isSavingEntity}>
                 <InputLabel id="manage-entity-type-label">Select Entity Type</InputLabel>
                 <Select labelId="manage-entity-type-label" label="Select Entity Type" value={selectedEntityType} onChange={handleEntityTypeChange}>
                     {Object.entries(MANAGED_ENTITIES).map(([key, config]) => (<MenuItem key={key} value={key}>{config.label}</MenuItem>))}
                 </Select>
             </FormControl>
             {/* Record Selection Dropdown (shows only if type is selected) */}
             {selectedEntityType && (
                 <FormControl fullWidth error={!selectedEntityId && !!entitySaveError && entityRecords.length > 0} disabled={isDeletingEntity || isSavingEntity || entityRecords.length === 0}>
                      <InputLabel id="manage-entity-record-label">Select Record to Edit/Delete</InputLabel>
                      <Select labelId="manage-entity-record-label" label="Select Record to Edit/Delete" value={selectedEntityId} onChange={handleEntitySelectChange} >
                           {entityRecords.length === 0 && <MenuItem value="" disabled>No records found for {MANAGED_ENTITIES[selectedEntityType]?.label || 'selection'}</MenuItem>}
                           {entityRecords.map((rec) => { const config = MANAGED_ENTITIES[selectedEntityType]; const k = rec[config.key]; const d = rec[config.display]; return (<MenuItem key={k} value={k}>{d} ({config.key}: {k})</MenuItem> ); })}
                      </Select>
                 </FormControl>
             )}
             {/* Entity Edit Form Area (shows only if record is selected) */}
             {entityFormData && (
                 <Stack spacing={2} border={1} borderColor="divider" borderRadius={1} p={2}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Edit Details:</Typography>
                      {/* Generic field rendering */}
                      {Object.entries(entityFormData).map(([field, value]) => {
                           const config = MANAGED_ENTITIES[selectedEntityType];
                           // Don't render the primary key or siteCode (for rooms) as editable
                           if (field === config?.key || (selectedEntityType === 'rooms' && field === 'siteCode')) return null;
                           // Don't render nested arrays like 'rooms' or 'semesters' here
                           if (Array.isArray(value)) return null;

                           return (
                               <TextField
                                   key={field}
                                   name={field}
                                   label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} // Attempt pretty label
                                   value={value || ""}
                                   onChange={handleEntityFieldChange}
                                   error={!!entityErrors[field]}
                                   helperText={entityErrors[field] || ""}
                                   fullWidth variant="outlined" size="small"
                                   disabled={isDeletingEntity || isSavingEntity} // Disable fields during operations
                                />
                           );
                        })}
                 </Stack>
             )}
             {/* General Error Alert */}
             {entitySaveError && <Alert severity="error" sx={{ mt: 1 }}>{entitySaveError}</Alert>}
          </Stack>
        </DialogContent>
        {/* Dialog Actions with Delete, Cancel, Save */}
        <DialogActions sx={{ padding: '16px 24px', justifyContent: 'space-between' }}>
            <Box> {/* Left side - Delete button */}
               {entityFormData && ( // Show only if a record is selected
                   <Button color="error" variant="outlined" onClick={handleDeleteEntity} disabled={isDeletingEntity || isSavingEntity} startIcon={isDeletingEntity ? <CircularProgress size={18} color="inherit"/> : null} >
                       {isDeletingEntity ? "Deleting..." : "Delete"} {MANAGED_ENTITIES[selectedEntityType]?.label || ''}
                   </Button>
               )}
           </Box>
           <Stack direction="row" spacing={1}> {/* Right side - Cancel/Save */}
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