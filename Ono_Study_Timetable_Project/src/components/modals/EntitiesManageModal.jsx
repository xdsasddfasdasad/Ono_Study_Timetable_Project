// src/components/modals/EntitiesManageModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Imports Material-UI components for building the modal's UI.
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
// Imports a generic, reusable modal wrapper component.
import PopupModal from '../UI/PopupModal';
// Imports a mapping utility that defines properties for each entity type (like collection names).
import { formMappings } from '../../utils/formMappings';
// Imports handlers that contain the actual Firestore logic for saving and deleting.
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
// Imports the generic Firestore fetch service.
import { fetchCollection } from '../../firebase/firestoreService';

// Import the specific form components that this modal can render.
import LecturerForm from './forms/LecturerForm';
import SiteForm from './forms/SiteForm';
import RoomForm from './forms/RoomForm';

// A mapping from an entity type string to its corresponding React component.
// This allows for dynamically rendering the correct form without a large switch statement.
const formComponents = {
  lecturer: LecturerForm,
  site: SiteForm,
  room: RoomForm,
};

// A constant defining the entity types this modal is responsible for managing.
const MANAGED_ENTITY_TYPES = ['lecturer', 'site', 'room'];

// This is a "smart" component that provides a single, generic interface for managing
// multiple types of data (entities). It handles its own data fetching, state management,
// and delegates saving/deleting actions to dedicated handlers.
export default function EntitiesManageModal({ open, onClose, onSaveSuccess }) {
    // === STATE MANAGEMENT ===
    const [entityType, setEntityType] = useState(''); // The type of entity being managed (e.g., 'lecturer').
    const [selectedAction, setSelectedAction] = useState(''); // The selected item to edit (by ID) or the '__add_new__' flag.
    const [dataStore, setDataStore] = useState({ lecturers: [], sites: [] }); // A local cache for data needed by the dropdowns.
    const [formData, setFormData] = useState(null); // The data object for the currently displayed form. Null if no form is shown.
    const [mode, setMode] = useState('select'); // The current mode of the modal: 'select', 'add', or 'edit'.
    const [isLoading, setIsLoading] = useState(false); // Controls loading indicators.
    const [apiError, setApiError] = useState(''); // Holds any general error message from an API call.
    const [errors, setErrors] = useState({}); // Holds field-specific validation errors.

    // === EFFECTS ===
    
    // This effect handles fetching initial data and resetting state when the modal is opened or closed.
    useEffect(() => {
        if (open) {
            // When the modal opens, fetch all necessary data in parallel for efficiency.
            setIsLoading(true);
            Promise.all([
                fetchCollection('lecturers'),
                fetchCollection('sites'),
            ]).then(([lecturers, sites]) => {
                // Store the fetched data in our local cache.
                setDataStore({ lecturers: lecturers || [], sites: sites || [] });
            }).catch(err => {
                setApiError("Failed to load essential data.");
                console.error(err);
            }).finally(() => {
                setIsLoading(false);
            });
        } else {
            // When the modal closes, reset all state to ensure it's clean for the next opening.
            setEntityType(''); setSelectedAction('');
            setFormData(null); setMode('select');
            setErrors({}); setApiError('');
        }
    }, [open]);

    // This effect reacts to user selections and prepares the form data for either adding or editing.
    useEffect(() => {
        // If we don't have the necessary selections, reset the form.
        if (!open || !entityType || !selectedAction) {
            setFormData(null); setMode('select');
            return;
        }

        const mapping = formMappings[entityType];
        if (!mapping) return;

        if (selectedAction === '__add_new__') {
            // If the user chooses to add a new item, set the mode to 'add'
            // and initialize a blank form using the mapping's initialData function.
            setMode('add');
            setFormData(mapping.initialData());
        } else {
            // If the user chooses an existing item, set the mode to 'edit'.
            setMode('edit');
            let collectionToSearch = [];
            if (entityType === 'room') {
                // Rooms are nested inside sites, so we need to flatten the data structure to find a room by its code.
                collectionToSearch = (dataStore.sites || []).flatMap(s => 
                    (s.rooms || []).map(r => ({...r, siteCode: s.siteCode})) // Ensure the parent siteCode is included.
                );
            } else {
                // For top-level entities like lecturers or sites, the collection is simple.
                const collectionName = `${entityType}s`;
                collectionToSearch = dataStore[collectionName] || [];
            }
            
            // Find the specific record to edit from our local data store.
            const recordToEdit = collectionToSearch.find(item => item[mapping.primaryKey] === selectedAction);
            // Populate the form with this record's data.
            setFormData(recordToEdit ? { ...recordToEdit } : null);
        }
    }, [open, entityType, selectedAction, dataStore]);

    // === HANDLERS ===
    
    // When the entity type changes, reset the subsequent action selection.
    const handleEntityTypeChange = (e) => {
        setEntityType(e.target.value);
        setSelectedAction('');
        setFormData(null);
    };

    // A generic change handler passed to the currently rendered form.
    // Wrapped in `useCallback` to prevent re-creating the function on every render,
    // which helps optimize child component rendering.
    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prevData => ({ ...prevData, [name]: finalValue }));
        // As a UX improvement, clear the validation error for a field as the user starts typing in it.
        setErrors(prevErrors => {
            if (!prevErrors[name]) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }, []);

    // Handles the save/update action. It delegates the actual API call to a dedicated handler function.
    const handleSave = useCallback(async () => {
        if (!formData || !entityType || !mode || mode === 'select') return;
        setIsLoading(true); setApiError(''); setErrors({});

        // This is a great example of separating UI logic from business logic.
        // This component doesn't know *how* to save to Firestore; it just calls a handler.
        const result = await handleSaveOrUpdateRecord(
            formMappings[entityType].collectionName, formData, mode,
            { recordType: entityType, editingId: mode === 'edit' ? selectedAction : null }
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess(); // Notify the parent component that data has changed.
        } else {
            // If the save fails, update the UI with the returned errors.
            setErrors(result.errors || {});
            setApiError(result.message || 'An error occurred.');
        }
    }, [entityType, mode, selectedAction, formData, onSaveSuccess]);

    // Handles the delete action.
    const handleDelete = useCallback(async () => {
        if (!entityType || !selectedAction || mode !== 'edit') return;
        const recordName = formData?.name || formData?.siteName || formData?.roomName || selectedAction;
        // Always ask for confirmation before a destructive action.
        if (!window.confirm(`Are you sure you want to delete ${entityType}: "${recordName}"?`)) return;
        setIsLoading(true);

        const result = await handleDeleteEntity(
            formMappings[entityType].collectionName, selectedAction,
            // Pass extra info needed for complex deletions (e.g., deleting a room from a site's array).
            { recordType: entityType, parentDocId: formData?.siteCode } 
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess(); // Notify parent of the change.
        } else {
            setApiError(result.message || 'Deletion failed.');
        }
    }, [entityType, selectedAction, mode, formData, onSaveSuccess]);

    // === RENDER LOGIC ===
    
    // Dynamically select the form component to render based on the current `entityType`.
    const CurrentForm = formComponents[entityType];
    
    // `useMemo` is a performance optimization. It caches the list of dropdown options
    // and only recalculates it if `entityType` or `dataStore` changes.
    const actionOptions = useMemo(() => {
        if (!entityType) return [];
        if (entityType === 'room') {
            return (dataStore.sites || []).flatMap(site => 
                (site.rooms || []).map(room => ({
                    value: room.roomCode,
                    label: `${room.roomName} (at ${site.siteName})`
                }))
            );
        }
        const collectionName = `${entityType}s`;
        const items = dataStore[collectionName] || [];
        const mapping = formMappings[entityType];
        return items.map(item => ({
            value: item[mapping.primaryKey],
            label: item.name || item.siteName || `Item ${item[mapping.primaryKey]}`,
        }));
    }, [entityType, dataStore]);

    // Bundles all props for the form component into a single object.
    // Memoizing this ensures that the form component doesn't re-render unnecessarily
    // if the parent re-renders for a reason unrelated to these props.
    const formProps = useMemo(() => ({
        formData: formData,
        onChange: handleFormChange,
        errors: errors,
        mode: mode,
        selectOptions: {
            sites: (dataStore.sites || []).map(site => ({
                value: site.siteCode,
                label: site.siteName,
            })),
        }
    }), [formData, errors, mode, handleFormChange, dataStore.sites]);

    return (
        <PopupModal open={open} onClose={() => !isLoading && onClose()} title="Manage Entities" maxWidth="sm">
            <Stack spacing={3} sx={{ p: 3, minHeight: 400 }}>
                {apiError && <Alert severity="error" onClose={() => setApiError('')}>{apiError}</Alert>}

                {/* Step 1: Select Entity Type */}
                <FormControl fullWidth disabled={isLoading}>
                    <InputLabel id="entity-type-label">1. Select Entity Type</InputLabel>
                    <Select labelId="entity-type-label" value={entityType} label="1. Select Entity Type" onChange={handleEntityTypeChange}>
                        <MenuItem value="" disabled><em>Select type...</em></MenuItem>
                        {MANAGED_ENTITY_TYPES.map(type => (
                            <MenuItem key={type} value={type} sx={{textTransform: 'capitalize'}}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Step 2: Select Action (only shown if Step 1 is complete) */}
                {entityType && (
                    <FormControl fullWidth disabled={isLoading}>
                        <InputLabel id="action-select-label">2. Select Action or Item to Edit</InputLabel>
                        <Select labelId="action-select-label" value={selectedAction} label="2. Select Action or Item to Edit" onChange={(e) => setSelectedAction(e.target.value)}>
                            <MenuItem value="" disabled><em>Select action...</em></MenuItem>
                            <MenuItem value="__add_new__">--- Add New {entityType} ---</MenuItem>
                            <Divider />
                            {actionOptions.length === 0 && <MenuItem disabled><em>No items to edit.</em></MenuItem>}
                            {/* Add index to the key to guarantee uniqueness, especially if labels/values could repeat. */}
                            {actionOptions.map((opt, index) => (
                                <MenuItem key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* Step 3: Render the Form (only shown if a form is ready to be displayed) */}
                {formData && CurrentForm && (
                     <>
                        <Divider />
                        <Typography variant="h6" sx={{mt: 2}}>{mode === 'add' ? `New ${entityType}` : `Editing ${entityType}`}</Typography>
                        {/* The dynamic form component is rendered here with all its props. */}
                        <CurrentForm {...formProps} />
                        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            {/* The delete button is only shown in edit mode. */}
                            {mode === 'edit' && (
                                <Button color="error" variant="outlined" onClick={handleDelete} disabled={isLoading} sx={{ mr: 'auto' }}>
                                    Delete
                                </Button>
                            )}
                            <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} /> : (mode === 'add' ? 'Save' : 'Update')}
                            </Button>
                        </Stack>
                     </>
                )}
            </Stack>
        </PopupModal>
    );
}