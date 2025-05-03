// src/pages/StudentManagementPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Stack, Alert, CircularProgress
} from "@mui/material";
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
import { getRecords } from "../utils/storage";
import { handleDeleteEntityFormSubmit } from "../handlers/formHandlers";
import StudentFormModal from "../components/modals/StudentFormModal";

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

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
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setStudentToEdit(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStudentToEdit(null);
  };

  const handleSaveSuccess = () => {
    console.log("[StudentPage] Save successful, reloading student list...");
    loadStudents();
  };

  const handleDeleteStudent = useCallback((studentId, studentName) => {
    if (!studentId) return;

    if (window.confirm(`Are you sure you want to delete student "${studentName}" (ID: ${studentId})? This action cannot be undone.`)) {
      console.log(`[StudentPage] Deleting student ${studentId}...`);
      handleDeleteEntityFormSubmit(
        "students",
        studentId,
        (successMessage) => {
          console.log("[StudentPage] Delete successful:", successMessage);
          alert(successMessage || "Student deleted successfully.");
          loadStudents();
        },
        (errorMessage) => {
          console.error("[StudentPage] Delete failed:", errorMessage);
          alert(`Error deleting student: ${errorMessage}`);
        }
      );
    }
  }, [loadStudents]);

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

      <StudentFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess} 
        initialData={studentToEdit} 
        existingStudents={students}
      />
    </Box>
  );
}