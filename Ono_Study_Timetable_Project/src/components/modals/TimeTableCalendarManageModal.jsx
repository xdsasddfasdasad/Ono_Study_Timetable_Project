import React, { useState, useEffect, useMemo } from 'react';
import {
    DialogContent, DialogActions, Button, Typography, Divider, Stack, Box,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, CircularProgress, Alert
} from '@mui/material';

import PopupModal from '../UI/PopupModal';
import TimeTableAddModal from './TimeTableAddModal';
import TimeTableEditModal from './TimeTableEditModal';

import { fetchCollection } from '../../firebase/firestoreService';
import { handleDeleteEntity } from '../../handlers/formHandlers';
import { formMappings } from '../../utils/formMappings';

const MANAGABLE_ENTITY_TYPES = {
    event: "General Event",
    holiday: "Holiday",
    vacation: "Vacation",
    task: "Task / Assignment",
    semester: "Semester",
    year: "Academic Year",
};

// ✨ FIX 1: Changed prop name from onSaveSuccess to onSave for consistency
export default function TimeTableCalendarManageModal({ open, onClose, onSave }) {
    const [view, setView] = useState('main');
    const [entityType, setEntityType] = useState('');
    const [entityId, setEntityId] = useState('');
    const [records, setRecords] = useState([]);
    const [recordToEdit, setRecordToEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) {
            setView('main');
            setEntityType('');
            setEntityId('');
            setRecords([]);
            setError('');
        }
    }, [open]);
    
    useEffect(() => {
      setEntityId('');
        if (!entityType) {
            setRecords([]);
            setEntityId('');
            return;
        }

const loadRecords = async () => {
            setIsLoading(true);
            setError('');
            try {
                let data = [];
                if (entityType === 'semester') {
                    const years = await fetchCollection('years');
                    data = (years || []).flatMap(y => 
                        (y.semesters || []).map(s => ({ ...s, recordType: 'semester', yearCode: y.yearCode, yearNumber: y.yearNumber }))
                    );
                } else {
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

    const sortedRecords = useMemo(() => {
        if (!records || records.length === 0) return [];
        
        return [...records].sort((a, b) => {
            if (a.recordType === 'year' && b.recordType === 'year') {
                // Sort years by number
                return (a.yearNumber || '').localeCompare(b.yearNumber || '');
            }
            if (a.recordType === 'semester' && b.recordType === 'semester') {
                // Sort semesters primarily by year, then by semester number
                const yearCompare = (a.yearNumber || '').localeCompare(b.yearNumber || '');
                if (yearCompare !== 0) return yearCompare;
                return (a.semesterNumber || '').localeCompare(b.semesterNumber || '');
            }
            // Fallback for other types (or mixed types)
            const dateA = a.startDate || a.submissionDate || '9999-12-31';
            const dateB = b.startDate || b.submissionDate || '9999-12-31';
            return dateA.localeCompare(dateB);
        });
    }, [records]);

    const handleAddClick = () => setView('add');

    const handleEditClick = () => {
        const record = records.find(r => r[formMappings[entityType]?.primaryKey] === entityId);
        if (record) {
            setRecordToEdit({ ...record, type: record.recordType });
            setView('edit');
        }
    };

    const handleDeleteClick = async () => {
        const mapping = formMappings[entityType];
        const record = records.find(r => r[mapping.primaryKey] === entityId);
        if (!record) return;

        let recordLabel = '';
        if (record.recordType === 'semester') {
            recordLabel = `Semester ${record.semesterNumber} (Year ${record.yearNumber})`;
        } else {
            recordLabel = record.eventName || record.holidayName || record.vacationName || record.assignmentName || record.yearNumber || entityId;
        }

        if (!window.confirm(`DELETE: "${recordLabel}"\nThis action cannot be undone.`)) return;

        const result = await handleDeleteEntity(mapping.collectionName, entityId, {
            recordType: entityType,
            parentDocId: record.yearCode,
        });

        if (result.success) {
            // ✨ FIX 2: Call the correctly named onSave prop
            onSave();
            onClose();
        } else {
            setError(result.message || 'Deletion failed.');
        }
    };

    // ✨ FIX 3: This function now correctly calls the onSave prop
    const handleSubModalSave = () => {
        if (onSave) {
            onSave();
        }
        onClose();
    };

    const handleSubModalClose = () => {
        setView('main');
        setRecordToEdit(null);
    };

    if (view === 'add') {
        return <TimeTableAddModal open={true} onClose={handleSubModalClose} onSave={handleSubModalSave} />;
    }

    if (view === 'edit') {
        return <TimeTableEditModal open={true} onClose={handleSubModalClose} onSave={handleSubModalSave} initialData={recordToEdit} />;
    }

    return (
        <PopupModal open={open} onClose={onClose} title="Manage Calendar Entry">
            <DialogContent>
                <Stack spacing={4}>
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

                    <Box>
                        <Typography variant="h6" gutterBottom>Edit or Delete an Existing Entry</Typography>
                        <Stack spacing={2} direction="column">
                            <FormControl fullWidth>
                                <InputLabel id="entity-type-label">1. Select Entry Type</InputLabel>
                                <Select
                                    labelId="entity-type-label"
                                    value={entityType}
                                    label="1. Select Entry Type"
                                    onChange={(e) => setEntityType(e.target.value)}
                                >
                                    <MenuItem value=""><em>-- Select Type --</em></MenuItem>
                                    {Object.entries(MANAGABLE_ENTITY_TYPES).map(([key, label]) => (
                                        <MenuItem key={key} value={key}>{label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {isLoading && <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress size={24} /></Box>}

                        <FormControl fullWidth disabled={!entityType || isLoading || sortedRecords.length === 0}>
                            <InputLabel id="entity-select-label">2. Select Specific Entry</InputLabel>
                            <Select
                                labelId="entity-select-label"
                                value={entityId}
                                label="2. Select Specific Entry"
                                onChange={(e) => setEntityId(e.target.value)}
                            >
                                {sortedRecords.map(record => { // <-- Using sortedRecords here
                                    const mapping = formMappings[record.recordType];
                                    const id = record[mapping.primaryKey];
                                    
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
                <Button 
                    color="error" 
                    onClick={handleDeleteClick} 
                    disabled={!entityId}
                >
                    Delete Selected
                </Button>
                <Stack direction="row" spacing={1}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleEditClick} 
                        disabled={!entityId}
                    >
                        Edit Selected
                    </Button>
                </Stack>
            </DialogActions>
        </PopupModal>
    );
}