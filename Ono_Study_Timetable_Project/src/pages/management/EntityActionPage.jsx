import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Stack, Alert, CircularProgress, Typography, Button, 
    Box, Paper, Breadcrumbs, Link as MuiLink 
} from "@mui/material";

import { fetchCollection, fetchDocumentById, fetchAllRooms } from '../../firebase/firestoreService';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { formMappings } from '../../utils/formMappings';

import LecturerForm from '../../components/modals/forms/LecturerForm';
import SiteForm from '../../components/modals/forms/SiteForm';
import RoomForm from '../../components/modals/forms/RoomForm';

const formComponents = {
  lecturer: LecturerForm,
  site: SiteForm,
  room: RoomForm,
};

export default function EntityActionPage() {
    const { entityType, mode, entityId } = useParams(); 
    const navigate = useNavigate();

    const [formData, setFormData] = useState(null);
    const [selectOptions, setSelectOptions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [errors, setErrors] = useState({});
    
    const isValidAction = useMemo(() => {
        return formComponents[entityType] && ['new', 'edit'].includes(mode) && (mode === 'new' || entityId);
    }, [entityType, mode, entityId]);

    useEffect(() => {
        if (!isValidAction) {
            setApiError('Invalid URL or action specified.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setApiError('');
        setErrors({});

        const mapping = formMappings[entityType];

        const loadData = async () => {
            try {
                if (entityType === 'room') {
                    const sites = await fetchCollection('sites');
                    setSelectOptions(prev => ({ ...prev, sites: (sites || []).map(s => ({ value: s.siteCode, label: s.siteName })) }));
                }

                if (mode === 'edit') {
                    let docData = null;
                    if (entityType === 'room') {
                        const allRooms = await fetchAllRooms(); 
                        docData = allRooms.find(r => r.roomCode === entityId);
                    } else {
                        docData = await fetchDocumentById(mapping.collectionName, entityId);
                    }

                    if (docData) {
                        setFormData(docData);
                    } else {
                        throw new Error(`The ${entityType} with ID ${entityId} could not be found.`);
                    }
                } else { // mode === 'new'
                    setFormData(mapping.initialData());
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setApiError(err.message || `Failed to load data for ${entityType}.`);
                setFormData(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

    }, [entityType, mode, entityId, isValidAction]);

    const handleFormChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prevData => ({ ...prevData, [name]: finalValue }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSave = useCallback(async () => {
        if (!formData) return;
        setIsLoading(true); 
        setApiError(''); 
        setErrors({});
        
        const handlerMode = mode === 'new' ? 'add' : 'edit';
        const dataToSave = { ...formData };
        const mapping = formMappings[entityType];

        // --- ✨ חגורת ביטחון אחרונה וסופית ✨ ---
        // ה-handler הגנרי דורש ID גם במצב 'add'. נוודא שהוא קיים.
        // זה רלוונטי במיוחד למרצים, אם ה-initialData שלהם לא מייצר ID.
        if (handlerMode === 'add' && !dataToSave[mapping.primaryKey]) {
            console.warn(`[DEFENSIVE CODE] Primary key '${mapping.primaryKey}' was missing for a new ${entityType}. Generating one now.`);
            // מייצרים ID זמני תואם לקונבנציה של שאר המערכת
            const prefix = (entityType === 'lecturer' ? 'L' : entityType.toUpperCase());
            dataToSave[mapping.primaryKey] = `${prefix}-${Date.now()}`;
        }
        
        const result = await handleSaveOrUpdateRecord(
            mapping.collectionName,
            dataToSave, // <-- שולחים את הנתונים שווידאנו שיש להם ID
            handlerMode,
            { recordType: entityType, editingId: mode === 'edit' ? entityId : null }
        );

        setIsLoading(false);
        if (result.success) {
            navigate('/manage-timetable');
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || 'An error occurred during save.');
        }
    }, [entityType, mode, entityId, formData, navigate]);

    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !entityId) return;

        const recordName = formData?.name || formData?.siteName || formData?.roomName || entityId;
        if (!window.confirm(`Are you sure you want to delete this ${entityType}: "${recordName}"? This action cannot be undone.`)) return;

        setIsLoading(true);
        const result = await handleDeleteEntity(
            formMappings[entityType].collectionName, entityId,
            { recordType: entityType, parentDocId: formData?.siteCode }
        );
        setIsLoading(false);

        if (result.success) {
            navigate('/manage-timetable');
        } else {
            setApiError(result.message || 'Deletion failed.');
        }
    }, [entityType, mode, entityId, formData, navigate]);

    const CurrentForm = formComponents[entityType];
    const pageTitle = `${mode === 'edit' ? 'Edit' : 'New'} ${entityType}`;

    const formProps = useMemo(() => ({
        formData,
        errors,
        onChange: handleFormChange,
        mode,
        selectOptions,
    }), [formData, errors, handleFormChange, mode, selectOptions]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }
    
    if (!isValidAction || apiError || !formData || !CurrentForm) {
        return (
            <Paper sx={{ p: 3, m: 2 }}>
                <Typography variant="h5" color="error.main" gutterBottom>Action Failed</Typography>
                <Alert severity="error">{apiError || "The requested action could not be performed."}</Alert>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/manage-timetable')}>
                    Back to Management
                </Button>
            </Paper>
        );
    }
    
    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <MuiLink component="button" onClick={() => navigate('/manage-timetable')} underline="hover" color="inherit">
                    Timetable Management
                </MuiLink>
                <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>{pageTitle}</Typography>
            </Breadcrumbs>
            
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                <Stack spacing={4}>
                    <Typography variant="h4" component="h1" sx={{ textTransform: 'capitalize' }}>
                        {pageTitle}
                    </Typography>

                    {apiError && <Alert severity="error" onClose={() => setApiError('')}>{apiError}</Alert>}

                    <CurrentForm {...formProps} />
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        {mode === 'edit' ? (
                            <Button color="error" variant="outlined" onClick={handleDelete} disabled={isLoading}>
                                Delete
                            </Button>
                        ) : <Box />}
                        
                        <Stack direction="row" spacing={2}>
                            <Button onClick={() => navigate('/manage-timetable')} disabled={isLoading}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                                {isLoading ? <CircularProgress size={24} /> : (mode === 'edit' ? 'Update' : 'Save')}
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}