// src/pages/StudentManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Stack, Alert, CircularProgress
} from "@mui/material";
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
import { getRecords } from "../utils/storage";
import { handleDeleteEntityFormSubmit } from "../handlers/formHandlers"; // Import delete handler
import StudentFormModal from "../components/modals/StudentFormModal"; // Import the new generic modal

// --- Main Student Management Page Component ---
export default function StudentManagementPage() {
  // State for the list of students
  const [students, setStudents] = useState([]);
  // State for loading and errors during initial load or refresh
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for controlling the Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null); // null for Add mode, student object for Edit mode

  // Fetch students from storage on component mount
  const loadStudents = useCallback(() => {
    console.log("[StudentPage] Loading students...");
    setIsLoading(true);
    setError(null);
    try {
      const storedStudents = getRecords("students") || [];
      setStudents(storedStudents);
    } catch (err) {
      console.error("[StudentPage] Error loading students:", err);
      setError("Failed to load student data.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed for initial load from storage

  useEffect(() => {
    loadStudents();
  }, [loadStudents]); // Load on mount

  // --- Modal Control Handlers ---
  const handleOpenAddModal = () => {
    setStudentToEdit(null); // Ensure Add mode
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setStudentToEdit(student); // Set student data for Edit mode
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStudentToEdit(null); // Clear selection on close
  };

  // Callback triggered by the modal after a successful save (add or edit)
  const handleSaveSuccess = () => {
    console.log("[StudentPage] Save successful, reloading student list...");
    loadStudents(); // Refresh the student list from storage
    // Optional: Show success notification (Snackbar)
  };

  // --- Delete Handler ---
  const handleDeleteStudent = useCallback((studentId, studentName) => {
    if (!studentId) return;

    if (window.confirm(`Are you sure you want to delete student "${studentName}" (ID: ${studentId})? This action cannot be undone.`)) {
      console.log(`[StudentPage] Deleting student ${studentId}...`);
      // Directly call the delete handler
      handleDeleteEntityFormSubmit(
        "students", // entityKey
        studentId,  // recordIdentifier (the student's ID)
        (successMessage) => { // onSuccess
          console.log("[StudentPage] Delete successful:", successMessage);
          alert(successMessage || "Student deleted successfully.");
          loadStudents(); // Refresh the list
        },
        (errorMessage) => { // onError
          console.error("[StudentPage] Delete failed:", errorMessage);
          alert(`Error deleting student: ${errorMessage}`);
        }
        // No parentIdentifier needed for top-level students
      );
    }
  }, [loadStudents]); // Dependency on loadStudents to refresh

  // --- Render Logic ---
  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1200px", margin: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Student Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
          Add Student
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table size="small" aria-label="students table">
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Username</TableCell>
                <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {/* Make name clickable for editing */}
                  <TableCell component="th" scope="row">
                    <Button variant="text" size="small" onClick={() => handleOpenEditModal(student)} sx={{ textTransform: 'none', textAlign: 'left', p: 0 }}>
                      {student.firstName} {student.lastName}
                    </Button>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEditModal(student)} aria-label={`edit ${student.firstName}`}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)} color="error" aria-label={`delete ${student.firstName}`}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    No students found. Use "Add Student" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Render the SINGLE generic modal for Add/Edit */}
      {/* Pass the existing students list for validation purposes */}
      <StudentFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess} // Callback on success
        initialData={studentToEdit}       // null for Add, student object for Edit
        existingStudents={students}       // Pass for validation checks
      />
    </Box>
  );
}