import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack, Alert, CircularProgress, Typography, Button,
  FormControl, InputLabel, Select, MenuItem, Divider, Box
} from "@mui/material";
import PopupModal from '../UI/PopupModal';
import { formMappings } from '../../utils/formMappings';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { fetchCollection } from '../../firebase/firestoreService';

// טפסים
import LecturerForm from './forms/LecturerForm';
import SiteForm from './forms/SiteForm';
import RoomForm from './forms/RoomForm';

// מיפוי בין סוג הישות לקומפוננטת הטופס שלה
const formComponents = {
  lecturer: LecturerForm,
  site: SiteForm,
  room: RoomForm,
};

// רשימת הישויות שהמודאל הזה מנהל
const MANAGED_ENTITY_TYPES = ['lecturer', 'site', 'room'];

export default function EntitiesManageModal({ open, onClose, onSaveSuccess }) {
    // === STATE MANAGEMENT ===
    const [entityType, setEntityType] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [dataStore, setDataStore] = useState({ lecturers: [], sites: [] });
    const [formData, setFormData] = useState(null);
    const [mode, setMode] = useState('select');
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [errors, setErrors] = useState({});

    // === EFFECTS ===
    
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            Promise.all([
                fetchCollection('lecturers'),
                fetchCollection('sites'),
            ]).then(([lecturers, sites]) => {
                setDataStore({ lecturers: lecturers || [], sites: sites || [] });
            }).catch(err => {
                setApiError("Failed to load essential data.");
                console.error(err);
            }).finally(() => {
                setIsLoading(false);
            });
        } else {
            setEntityType(''); setSelectedAction('');
            setFormData(null); setMode('select');
            setErrors({}); setApiError('');
        }
    }, [open]);

    useEffect(() => {
        if (!open || !entityType || !selectedAction) {
            setFormData(null); setMode('select');
            return;
        }

        const mapping = formMappings[entityType];
        if (!mapping) return;

        if (selectedAction === '__add_new__') {
            setMode('add');
            setFormData(mapping.initialData());
        } else {
            setMode('edit');
            let collectionToSearch = [];
            if (entityType === 'room') {
                collectionToSearch = (dataStore.sites || []).flatMap(s => 
                    (s.rooms || []).map(r => ({...r, siteCode: s.siteCode})) // Ensure siteCode is present
                );
            } else {
                const collectionName = `${entityType}s`;
                collectionToSearch = dataStore[collectionName] || [];
            }
            
            const recordToEdit = collectionToSearch.find(item => item[mapping.primaryKey] === selectedAction);
            setFormData(recordToEdit ? { ...recordToEdit } : null);
        }
    }, [open, entityType, selectedAction, dataStore]);

    // === HANDLERS ===
    
    const handleEntityTypeChange = (e) => {
        setEntityType(e.target.value);
        setSelectedAction('');
        setFormData(null);
    };

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prevData => ({ ...prevData, [name]: finalValue }));
        setErrors(prevErrors => {
            if (!prevErrors[name]) return prevErrors;
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    }, []);

    const handleSave = useCallback(async () => {
        if (!formData || !entityType || !mode || mode === 'select') return;
        setIsLoading(true); setApiError(''); setErrors({});

        const result = await handleSaveOrUpdateRecord(
            formMappings[entityType].collectionName, formData, mode,
            { recordType: entityType, editingId: mode === 'edit' ? selectedAction : null }
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess();
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || 'An error occurred.');
        }
    }, [entityType, mode, selectedAction, formData, onSaveSuccess]);

    const handleDelete = useCallback(async () => {
        if (!entityType || !selectedAction || mode !== 'edit') return;
        const recordName = formData?.name || formData?.siteName || formData?.roomName || selectedAction;
        if (!window.confirm(`Are you sure you want to delete ${entityType}: "${recordName}"?`)) return;
        setIsLoading(true);

        const result = await handleDeleteEntity(
            formMappings[entityType].collectionName, selectedAction,
            { recordType: entityType, parentDocId: formData?.siteCode } 
        );
        setIsLoading(false);

        if (result.success) {
            onSaveSuccess();
        } else {
            setApiError(result.message || 'Deletion failed.');
        }
    }, [entityType, selectedAction, mode, formData, onSaveSuccess]);

    // === RENDER LOGIC ===
    const CurrentForm = formComponents[entityType];
    
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

                <FormControl fullWidth disabled={isLoading}>
                    <InputLabel id="entity-type-label">1. Select Entity Type</InputLabel>
                    <Select
                        labelId="entity-type-label" value={entityType}
                        label="1. Select Entity Type" onChange={handleEntityTypeChange}
                    >
                        <MenuItem value="" disabled><em>Select type...</em></MenuItem>
                        {MANAGED_ENTITY_TYPES.map(type => (
                            <MenuItem key={type} value={type} sx={{textTransform: 'capitalize'}}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {entityType && (
                    <FormControl fullWidth disabled={isLoading}>
                        <InputLabel id="action-select-label">2. Select Action or Item to Edit</InputLabel>
                        <Select
                            labelId="action-select-label" value={selectedAction}
                            label="2. Select Action or Item to Edit" onChange={(e) => setSelectedAction(e.target.value)}
                        >
                            <MenuItem value="" disabled><em>Select action...</em></MenuItem>
                            <MenuItem value="__add_new__">--- Add New {entityType} ---</MenuItem>
                            <Divider />
                            {actionOptions.length === 0 && <MenuItem disabled><em>No items to edit.</em></MenuItem>}
                            {/* ✨ FIX: Add the index to the key to ensure uniqueness */}
                            {actionOptions.map((opt, index) => (
                                <MenuItem key={`${opt.value}-${index}`} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {formData && CurrentForm && (
                     <>
                        <Divider />
                        <Typography variant="h6" sx={{mt: 2}}>{mode === 'add' ? `New ${entityType}` : `Editing ${entityType}`}</Typography>
                        <CurrentForm {...formProps} />
                        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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