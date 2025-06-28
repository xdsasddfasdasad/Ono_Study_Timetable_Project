// src/components/modals/TimeTableCalendarManageModal.jsx

import React, { useState, useEffect, useMemo } from 'react';
// Imports Material-UI components for building the modal's UI.
import {
    DialogContent, DialogActions, Button, Typography, Divider, Stack, Box,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert
} from '@mui/material';
// Imports a generic modal wrapper and the specific sub-modals this component will render.
import PopupModal from '../UI/PopupModal';
import TimeTableAddModal from './TimeTableAddModal';
import TimeTableEditModal from './TimeTableEditModal';
// Imports services and utilities for data fetching, deletion, and mapping.
import { fetchCollection } from '../../firebase/firestoreService';
import { handleDeleteEntity } from '../../handlers/formHandlers';
import { formMappings } from '../../utils/formMappings';

// A constant defining the entity types this modal is responsible for managing.
const MANAGABLE_ENTITY_TYPES = {
    event: "General Event",
    holiday: "Holiday",
    vacation: "Vacation",
    task: "Task / Assignment",
    semester: "Semester",
    year: "Academic Year",
};

// This is a high-level "smart" component that acts as a central hub for managing various calendar-related entries.
// It doesn't have a form itself but instead renders other modals (`TimeTableAddModal`, `TimeTableEditModal`)
// based on the user's actions.
export default function TimeTableCalendarManageModal({ open, onClose, onSave }) {
    // === STATE MANAGEMENT ===
    // The `view` state is the core of this component's logic, acting as a router.
    const [view, setView] = useState('main'); // Can be 'main', 'add', or 'edit'.
    const [entityType, setEntityType] = useState(''); // The type of entity the user wants to manage.
    const [entityId, setEntityId] = useState(''); // The ID of the specific entity to edit/delete.
    const [records, setRecords] = useState([]); // A local cache of the fetched records for the selected entity type.
    const [recordToEdit, setRecordToEdit] = useState(null); // The data for the record being passed to the edit modal.
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Effect to reset the component's state whenever the modal is closed.
    useEffect(() => {
        if (!open) {
            setView('main');
            setEntityType('');
            setEntityId('');
            setRecords([]);
            setError('');
        }
    }, [open]);
    
    // Effect to fetch the appropriate records whenever the user selects a new entity type.
    useEffect(() => {
        setEntityId(''); // Reset the specific item selection.
        if (!entityType) {
            setRecords([]);
            return;
        }

        const loadRecords = async () => {
            setIsLoading(true);
            setError('');
            try {
                let data = [];
                // 'semester' has special loading logic because semesters are nested inside 'years' documents.
                if (entityType === 'semester') {
                    const years = await fetchCollection('years');
                    // We flatten the nested structure to create a simple list of semester records.
                    data = (years || []).flatMap(y => 
                        (y.semesters || []).map(s => ({ ...s, recordType: 'semester', yearCode: y.yearCode, yearNumber: y.yearNumber }))
                    );
                } else {
                    // For all other types, we can fetch the collection directly using the mapping.
                    const collectionName = formMappings[entityType]?.collectionName;
                    const fetchedData = await fetchCollection(collectionName);
                    data = (fetchedData || []).map(d => ({ ...d, recordType: entityType }));
                }
                setRecords(data);
            } catch (err) {
                console.error(`Failed to load ${entityType}:`, err);
                setError(`Could not load ${MANAGABLE_ENTITY_TYPES[entityType]}.`);
            } finally {
                setIsLoading(false);
            }
        };

        loadRecords();
    }, [entityType]);

    // A memoized hook to sort the fetched records for user-friendly display in the dropdown.
    const sortedRecords = useMemo(() => {
        if (!records || records.length === 0) return [];
        
        return [...records].sort((a, b) => {
            // Custom sorting logic for years and semesters.
            if (a.recordType === 'year' && b.recordType === 'year') {
                return (a.yearNumber || '').localeCompare(b.yearNumber || '');
            }
            if (a.recordType === 'semester' && b.recordType === 'semester') {
                const yearCompare = (a.yearNumber || '').localeCompare(b.yearNumber || '');
                if (yearCompare !== 0) return yearCompare;
                return (a.semesterNumber || '').localeCompare(b.semesterNumber || '');
            }
            // A generic fallback sort for all other types based on their start/submission date.
            const dateA = a.startDate || a.submissionDate || '9999-12-31';
            const dateB = b.startDate || b.submissionDate || '9999-12-31';
            return dateA.localeCompare(dateB);
        });
    }, [records]);

    // === HANDLERS ===
    
    // Switches the view to render the 'add' modal.
    const handleAddClick = () => setView('add');

    // Finds the selected record, sets it as the data to edit, and switches the view.
    const handleEditClick = () => {
        const record = records.find(r => r[formMappings[entityType]?.primaryKey] === entityId);
        if (record) {
            setRecordToEdit({ ...record, type: record.recordType });
            setView('edit');
        }
    };

    // Handles the delete confirmation and action.
    const handleDeleteClick = async () => {
        const mapping = formMappings[entityType];
        const record = records.find(r => r[mapping.primaryKey] === entityId);
        if (!record) return;

        // Construct a user-friendly label for the confirmation dialog.
        let recordLabel = '';
        if (record.recordType === 'semester') {
            recordLabel = `Semester ${record.semesterNumber} (Year ${record.yearNumber})`;
        } else {
            recordLabel = record.eventName || record.holidayName || record.vacationName || record.assignmentName || record.yearNumber || entityId;
        }

        if (!window.confirm(`DELETE: "${recordLabel}"\nThis action cannot be undone.`)) return;

        const result = await handleDeleteEntity(mapping.collectionName, entityId, {
            recordType: entityType,
            parentDocId: record.yearCode, // Pass parent ID for nested deletions (like semesters).
        });

        if (result.success) {
            onSave(); // Notify the parent that data has changed, triggering a refresh.
            onClose();
        } else {
            setError(result.message || 'Deletion failed.');
        }
    };

    // These handlers are passed to the sub-modals.
    // When a sub-modal saves or closes, it calls these to return control to this main manager modal.
    const handleSubModalSave = () => {
        if (onSave) onSave();
        onClose(); // This closes the entire manager modal.
    };

    const handleSubModalClose = () => {
        setView('main'); // Return to the main selection view.
        setRecordToEdit(null);
    };

    // --- RENDER LOGIC ---
    // The component's output is determined by the `view` state.

    // If view is 'add', render the TimeTableAddModal and halt further rendering.
    if (view === 'add') {
        return <TimeTableAddModal open={true} onClose={handleSubModalClose} onSave={handleSubModalSave} />;
    }

    // If view is 'edit', render the TimeTableEditModal and halt further rendering.
    if (view === 'edit') {
        return <TimeTableEditModal open={true} onClose={handleSubModalClose} onSave={handleSubModalSave} initialData={recordToEdit} />;
    }

    // Otherwise, render the main selection interface.
    return (
        <PopupModal open={open} onClose={onClose} title="Manage Calendar Entry">
            <DialogContent>
                <Stack spacing={4}>
                    {/* Section for adding a new entry */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Add New Entry</Typography>
                        <Button variant="contained" onClick={handleAddClick} fullWidth>
                            Add a New Calendar Entry
                        </Button>
                        <FormHelperText sx={{textAlign: 'center', mt: 1}}>
                            (Event, Holiday, Vacation, Task, Year, or Semester)
                        </FormHelperText>
                    </Box>

                    <Divider>OR</Divider>

                    {/* Section for editing or deleting an existing entry */}
                    <Box>
                        <Typography variant="h6" gutterBottom>Edit or Delete an Existing Entry</Typography>
                        <Stack spacing={2} direction="column">
                            <FormControl fullWidth>
                                <InputLabel id="entity-type-label">1. Select Entry Type</InputLabel>
                                <Select labelId="entity-type-label" value={entityType} label="1. Select Entry Type" onChange={(e) => setEntityType(e.target.value)}>
                                    <MenuItem value=""><em>-- Select Type --</em></MenuItem>
                                    {Object.entries(MANAGABLE_ENTITY_TYPES).map(([key, label]) => (
                                        <MenuItem key={key} value={key}>{label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {isLoading && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress size={24} /></Box>}

                            <FormControl fullWidth disabled={!entityType || isLoading || sortedRecords.length === 0}>
                                <InputLabel id="entity-select-label">2. Select Specific Entry</InputLabel>
                                <Select labelId="entity-select-label" value={entityId} label="2. Select Specific Entry" onChange={(e) => setEntityId(e.target.value)}>
                                    {/* The dropdown is populated by the memoized, sorted records. */}
                                    {sortedRecords.map(record => {
                                        const mapping = formMappings[record.recordType];
                                        const id = record[mapping.primaryKey];
                                        
                                        // Construct a user-friendly label for each record.
                                        let label = '';
                                        if (record.recordType === 'semester') {
                                            label = `Semester ${record.semesterNumber} (Year ${record.yearNumber})`;
                                        } else {
                                            label = record.eventName || record.holidayName || record.vacationName || record.assignmentName || record.yearNumber;
                                        }
                                        
                                        return <MenuItem key={id} value={id}>{label}</MenuItem>;
                                    })}
                                    {sortedRecords.length === 0 && <MenuItem value="" disabled>No entries found</MenuItem>}
                                </Select>
                            </FormControl>
                        </Stack>

                        {error && <Alert severity="error" sx={{mt: 2}}>{error}</Alert>}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{justifyContent: "space-between", p: '16px 24px'}}>
                <Button color="error" onClick={handleDeleteClick} disabled={!entityId}>
                    Delete Selected
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleEditClick} disabled={!entityId}>
                        Edit Selected
                    </Button>
                </Stack>
            </DialogActions>
        </PopupModal>
    );
}