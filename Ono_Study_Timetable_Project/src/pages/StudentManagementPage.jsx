// src/pages/StudentManagementPage.jsx

import React, { useState, useEffect, useCallback } from "react";
// Imports Material-UI components for building the table layout and loading states.
import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Stack, Alert, 
  CircularProgress, LinearProgress, Skeleton
} from "@mui/material";
// Imports icons for the action buttons in the table.
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
// Imports the Firestore service functions.
import { fetchCollection, deleteDocument } from "../firebase/firestoreService";
// Imports the modal component used for adding and editing students.
import StudentFormModal from "../components/modals/StudentFormModal";

// A helper component to show a "skeleton" of the table while its data is loading.
// This provides a better user experience by showing a placeholder of the final layout.
const TableSkeleton = ({ rowsNum = 5 }) => (
    <TableContainer component={Paper} elevation={3}>
        <Table size="small">
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Username</TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {/* Render a specified number of placeholder rows. */}
                {Array.from({ length: rowsNum }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell align="right"><Skeleton variant="circular" width={24} height={24} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
);

// This is the "smart" page component for managing student accounts.
// It fetches and displays a list of students and provides UI for CRUD operations.
export default function StudentManagementPage() {
  // === STATE MANAGEMENT ===
  const [students, setStudents] = useState([]); // Holds the array of student objects.
  const [isLoading, setIsLoading] = useState(true); // Manages the loading state for the page.
  const [error, setError] = useState(null); // Holds any error messages.
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls the visibility of the StudentFormModal.
  const [studentToEdit, setStudentToEdit] = useState(null); // Holds the data for the student being edited.

  // --- DATA FETCHING ---
  // A memoized function to fetch the list of students from Firestore.
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedStudents = await fetchCollection("students");
      setStudents(fetchedStudents || []);
    } catch (err) {
      console.error("[StudentPage] Error loading students:", err);
      setError("Failed to load student data. Please try refreshing.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch the students when the component first mounts.
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // --- HANDLERS ---
  // Opens the modal in "add" mode by ensuring `studentToEdit` is null.
  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  // Opens the modal in "edit" mode by setting `studentToEdit` with the selected student's data.
  const handleOpenEditModal = (student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  // Closes the modal and resets the `studentToEdit` state.
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStudentToEdit(null);
  };

  // This function is passed to the modal. When the modal reports a successful save,
  // this function is called, which then triggers a re-fetch of the student list.
  const handleSaveSuccess = () => {
    loadStudents();
  };

  // Handles the deletion of a student.
  const handleDeleteStudent = useCallback(async (studentId, studentName) => {
    if (!studentId) return;

    // Always ask for confirmation before a destructive action.
    if (window.confirm(`Are you sure you want to delete student "${studentName || 'N/A'}" (ID: ${studentId})? This action cannot be undone.`)) {
      setIsLoading(true); 
      try {
        // NOTE: This only deletes the Firestore document. As per business logic, the
        // corresponding Firebase Auth user is intentionally NOT deleted to prevent accidents.
        await deleteDocument("students", studentId);
        alert(`Student "${studentName || studentId}" deleted successfully.`);
        loadStudents(); // Re-fetch the list to update the UI.
      } catch (err) {
        console.error("[StudentPage:Delete] Error deleting student:", err);
        alert(`Error deleting student: ${err.message || "Unknown error"}`);
        setIsLoading(false); // Turn off loading only on error, as `loadStudents` will handle it on success.
      }
    }
  }, [loadStudents]);

  // --- RENDER LOGIC ---
  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1200px", margin: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4" component="h1"> Student Management </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={isLoading}>
          Add Student
        </Button>
      </Stack>
      
      {/* A global loading bar for the page. */}
      <Box sx={{ height: 4, mb: 3 }}>
        {isLoading && <LinearProgress />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Improved rendering logic: Show the skeleton only on the initial load. */}
      {isLoading && students.length === 0 ? (
        <TableSkeleton />
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table size="small" aria-label="students table">
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Map over the students array to render a row for each student. */}
              {students.map((student) => (
                <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {/* The student's name is a button to open the edit modal. */}
                    <Button variant="text" size="small" onClick={() => handleOpenEditModal(student)} sx={{ textTransform: 'none', textAlign: 'left', p: 0, justifyContent: 'flex-start' }} disabled={isLoading}>
                      {student.firstName} {student.lastName}
                    </Button>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell align="right">
                    {/* Action buttons for editing and deleting. */}
                    <IconButton size="small" onClick={() => handleOpenEditModal(student)} aria-label={`edit ${student.firstName}`} disabled={isLoading}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)} color="error" aria-label={`delete ${student.firstName}`} disabled={isLoading}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {/* Show a "No students found" message only if not loading and the array is empty. */}
              {!isLoading && students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary', py: 3 }}>
                    No students found. Use "Add Student" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* The modal for adding/editing students. It is controlled by this page. */}
      <StudentFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        initialData={studentToEdit}
      />
    </Box>
  );
}