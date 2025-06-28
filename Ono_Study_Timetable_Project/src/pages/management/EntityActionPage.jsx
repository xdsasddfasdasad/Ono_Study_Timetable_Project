// src/pages/EntityActionPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Imports routing hooks to get URL parameters and for programmatic navigation.
import { useParams, useNavigate } from 'react-router-dom';
// Imports Material-UI components for layout, including new additions for loading states.
import { 
    Stack, Alert, CircularProgress, Typography, Button, 
    Box, Paper, Breadcrumbs, Link as MuiLink, 
    LinearProgress, Skeleton // Skeleton and LinearProgress are for better loading UX.
} from "@mui/material";

// Imports the necessary services, handlers, and mappings.
import { fetchCollection, fetchDocumentById, fetchAllRooms } from '../../firebase/firestoreService';
import { handleSaveOrUpdateRecord, handleDeleteEntity } from '../../handlers/formHandlers';
import { formMappings } from '../../utils/formMappings';

// Imports the "dumb" form components that this page can render.
import LecturerForm from '../../components/modals/forms/LecturerForm';
import SiteForm from '../../components/modals/forms/SiteForm';
import RoomForm from '../../components/modals/forms/RoomForm';

// A mapping from the URL entityType parameter to the actual form component.
const formComponents = {
  lecturer: LecturerForm,
  site: SiteForm,
  room: RoomForm,
};

// A helper component to show a "skeleton" of the form while data is loading.
// This improves the user experience by preventing layout shifts and showing that content is coming.
const FormSkeleton = () => (
    <Stack spacing={3}>
        <Skeleton variant="rectangular" height={56} />
        <Skeleton variant="rectangular" height={56} />
        <Skeleton variant="rectangular" height={80} />
    </Stack>
);

// This is a "smart" page component that serves as a dedicated route for adding or editing
// a specific type of entity. It derives all its behavior from the URL parameters.
export default function EntityActionPage() {
    // `useParams` extracts the dynamic segments from the URL (e.g., from /lecturer/edit/L01).
    const { entityType, mode, entityId } = useParams(); 
    const navigate = useNavigate();

    // === STATE MANAGEMENT ===
    const [formData, setFormData] = useState(null); // The data for the form.
    const [selectOptions, setSelectOptions] = useState({}); // Options for any dropdowns in the form.
    const [isLoading, setIsLoading] = useState(true); // A general loading state for the page.
    const [apiError, setApiError] = useState(''); // Any error messages to display.
    const [errors, setErrors] = useState({}); // Field-specific validation errors.
    
    // A memoized check to determine if the URL parameters are valid.
    // This prevents the component from trying to process invalid requests (e.g., /foo/bar/baz).
    const isValidAction = useMemo(() => {
        return formComponents[entityType] && ['new', 'edit'].includes(mode) && (mode === 'new' || entityId);
    }, [entityType, mode, entityId]);

    // This is the main effect for fetching the necessary data to display the form.
    // It runs when the component mounts or when the URL parameters change.
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
                // Load any necessary data for dropdowns (select options).
                // In this case, if we're dealing with a room, we need the list of sites.
                if (entityType === 'room') {
                    const sites = await fetchCollection('sites');
                    setSelectOptions(prev => ({ ...prev, sites: (sites || []).map(s => ({ value: s.siteCode, label: s.siteName })) }));
                }

                if (mode === 'edit') {
                    // In edit mode, fetch the existing data for the record.
                    let docData = null;
                    if (entityType === 'room') {
                        // Rooms have special fetching logic as they are nested in sites.
                        const allRooms = await fetchAllRooms(); 
                        docData = allRooms.find(r => r.roomCode === entityId);
                    } else {
                        // For other entities, fetch the document directly.
                        docData = await fetchDocumentById(mapping.collectionName, entityId);
                    }

                    if (docData) {
                        setFormData(docData);
                    } else {
                        throw new Error(`The ${entityType} with ID ${entityId} could not be found.`);
                    }
                } else { // mode === 'new'
                    // In 'new' mode, initialize the form with default blank data.
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

    }, [entityType, mode, entityId, isValidAction]); // Re-run if any URL parameter changes.

    // A generic handler for form field changes.
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

    // A handler for saving or updating the record.
    const handleSave = useCallback(async () => {
        if (!formData) return;
        setIsLoading(true); 
        setApiError(''); 
        setErrors({});
        
        const handlerMode = mode === 'new' ? 'add' : 'edit';
        const dataToSave = { ...formData };
        const mapping = formMappings[entityType];

        // This is a defensive coding practice. If a primary key is somehow missing when adding
        // a new record, it generates a temporary one to prevent a crash.
        if (handlerMode === 'add' && !dataToSave[mapping.primaryKey]) {
            console.warn(`[DEFENSIVE CODE] Primary key '${mapping.primaryKey}' was missing for a new ${entityType}. Generating one now.`);
            const prefix = (entityType === 'lecturer' ? 'L' : entityType.toUpperCase());
            dataToSave[mapping.primaryKey] = `${prefix}-${Date.now()}`;
        }
        
        // Delegate the actual save/update logic to the central handler.
        const result = await handleSaveOrUpdateRecord( mapping.collectionName, dataToSave, handlerMode, { recordType: entityType, editingId: mode === 'edit' ? entityId : null } );

        setIsLoading(false);
        if (result.success) {
            // On success, navigate back to the main management page.
            navigate('/manage-timetable');
        } else {
            setErrors(result.errors || {});
            setApiError(result.message || 'An error occurred during save.');
        }
    }, [entityType, mode, entityId, formData, navigate]);

    // A handler for deleting the record.
    const handleDelete = useCallback(async () => {
        if (mode !== 'edit' || !entityId) return;
        if (!window.confirm(`Are you sure you want to delete this ${entityType}? This action cannot be undone.`)) return;

        setIsLoading(true);
        // Delegate the deletion logic to the central handler.
        const result = await handleDeleteEntity( formMappings[entityType].collectionName, entityId, { recordType: entityType, parentDocId: formData?.siteCode } );
        setIsLoading(false);

        if (result.success) {
            navigate('/manage-timetable');
        } else {
            setApiError(result.message || 'Deletion failed.');
        }
    }, [entityType, mode, entityId, formData, navigate]);

    // Dynamically select the correct form component based on the URL parameter.
    const CurrentForm = formComponents[entityType];
    const pageTitle = useMemo(() => {
        if (!isValidAction) return 'Invalid Page';
        return `${mode === 'edit' ? 'Edit' : 'New'} ${entityType}`;
    }, [mode, entityType, isValidAction]);

    // Memoize the props object for the form to optimize rendering.
    // The form is disabled via the onChange handler while the page is in a loading state.
    const formProps = useMemo(() => ({
        formData,
        errors,
        onChange: isLoading ? () => {} : handleFormChange, 
        mode,
        selectOptions,
    }), [formData, errors, handleFormChange, mode, selectOptions, isLoading]);
    
    // Render a dedicated error page if the URL is invalid.
    if (!isValidAction) {
        return (
            <Paper sx={{ p: 3, m: 2 }}>
                <Typography variant="h5" color="error.main" gutterBottom>Invalid Action</Typography>
                <Alert severity="error">{apiError || "The requested action or entity type is not valid."}</Alert>
                <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/manage-timetable')}>
                    Back to Management
                </Button>
            </Paper>
        );
    }
    
    // Main render output for a valid action.
    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            {/* Breadcrumbs provide clear navigation context for the user. */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
                <MuiLink component="button" onClick={() => navigate('/manage-timetable')} underline="hover" color="inherit">
                    Timetable Management
                </MuiLink>
                <Typography color="text.primary" sx={{ textTransform: 'capitalize' }}>{pageTitle}</Typography>
            </Breadcrumbs>
            
            {/* A global loading bar at the top of the page for visual feedback. */}
            <Box sx={{ height: 4, my: 2 }}>
              {isLoading && <LinearProgress />}
            </Box>
            
            <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
                <Stack spacing={4}>
                    <Typography variant="h4" component="h1" sx={{ textTransform: 'capitalize' }}>
                        {pageTitle}
                    </Typography>

                    {apiError && <Alert severity="error" onClose={() => setApiError('')}>{apiError}</Alert>}
                    
                    {/* Render the skeleton while loading, or the actual form once data is ready. */}
                    {isLoading && !formData ? <FormSkeleton /> : <CurrentForm {...formProps} />}
                    
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        {/* The Delete button is only shown in edit mode. */}
                        {mode === 'edit' ? (
                            <Button color="error" variant="outlined" onClick={handleDelete} disabled={isLoading}>
                                Delete
                            </Button>
                        ) : <Box /> /* An empty box to maintain layout. */}
                        
                        <Stack direction="row" spacing={2}>
                            <Button onClick={() => navigate('/manage-timetable')} disabled={isLoading}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                                {mode === 'edit' ? 'Update' : 'Save'}
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}