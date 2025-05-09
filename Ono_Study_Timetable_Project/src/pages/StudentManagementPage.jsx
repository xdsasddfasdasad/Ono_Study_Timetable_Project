import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Stack, Alert, CircularProgress
} from "@mui/material";
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
// ✅ Import Firestore service functions
import { fetchCollection, deleteDocument } from "../firebase/firestoreService"; // Adjust path if needed
// ✅ StudentFormModal now handles its own save logic via Firestore-ready handlers
import StudentFormModal from "../components/modals/StudentFormModal";

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null); // null for Add, student object for Edit

  // ✅ Async function to load students from Firestore
  const loadStudents = useCallback(async () => {
    console.log("[StudentPage] Loading students from Firestore...");
    setIsLoading(true);
    setError(null);
    try {
      const fetchedStudents = await fetchCollection("students");
      setStudents(fetchedStudents || []); // Ensure it's an array
      console.log(`[StudentPage] Loaded ${fetchedStudents?.length || 0} students.`);
    } catch (err) {
      console.error("[StudentPage] Error loading students:", err);
      setError("Failed to load student data. Please try refreshing.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies, called on mount and after save/delete

  useEffect(() => {
    loadStudents();
  }, [loadStudents]); // Initial load

  // --- Modal Control ---
  const handleOpenAddModal = () => {
    setStudentToEdit(null); // Clear for Add mode
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setStudentToEdit(student); // Set data for Edit mode
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStudentToEdit(null); // Clear selection
  };

  // Called by StudentFormModal after successful save/update
  const handleSaveSuccess = () => {
    console.log("[StudentPage] Student save/update successful, reloading list...");
    loadStudents(); // Refresh the student list from Firestore
    // Optionally show a Snackbar success message
  };

  // --- Delete Student Handler (using Firestore directly) ---
  const handleDeleteStudent = useCallback(async (studentId, studentName) => {
    if (!studentId) {
      console.error("[StudentPage:Delete] No student ID provided.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete student "${studentName || 'N/A'}" (ID: ${studentId})? This action cannot be undone.`)) {
      console.log(`[StudentPage:Delete] Attempting to delete student ${studentId} from Firestore...`);
      setIsLoading(true); // Indicate loading for delete operation
      try {
        await deleteDocument("students", studentId); // Call Firestore service directly
        console.log("[StudentPage:Delete] Student deleted successfully from Firestore.");
        alert(`Student "${studentName || studentId}" deleted successfully.`);
        loadStudents(); // Refresh the list after successful deletion
      } catch (err) {
        console.error("[StudentPage:Delete] Error deleting student:", err);
        alert(`Error deleting student: ${err.message || "Unknown error"}`);
        setIsLoading(false); // Ensure loading is turned off on error
      }
      // No finally needed for setIsLoading(false) here if loadStudents() handles it
    }
  }, [loadStudents]); // Dependency on loadStudents

  // --- Render Logic ---
  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1200px", margin: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1"> Student Management </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={isLoading}>
          Add Student
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading && students.length === 0 ? ( // Show main loader only on initial empty load
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress /> <Typography sx={{ml:2}}>Loading Students...</Typography>
        </Box>
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
              {students.map((student) => (
                <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Button variant="text" size="small" onClick={() => handleOpenEditModal(student)} sx={{ textTransform: 'none', textAlign: 'left', p: 0, justifyContent: 'flex-start' }}>
                      {student.firstName} {student.lastName}
                    </Button>
                  </TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEditModal(student)} aria-label={`edit ${student.firstName}`} disabled={isLoading}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)} color="error" aria-label={`delete ${student.firstName}`} disabled={isLoading}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Render the StudentFormModal for both Add and Edit */}
      {/* No longer passing existingStudents, modal's validation will query Firestore */}
      <StudentFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        initialData={studentToEdit}
        // existingStudents prop removed
      />
    </Box>
  );
}