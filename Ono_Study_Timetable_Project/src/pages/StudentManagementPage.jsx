import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Button, IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Stack, Alert, 
  CircularProgress, LinearProgress, Skeleton // ✨ 1. הוספת ייבוא
} from "@mui/material";
import { Delete, Edit, Add as AddIcon } from "@mui/icons-material";
import { fetchCollection, deleteDocument } from "../firebase/firestoreService";
import StudentFormModal from "../components/modals/StudentFormModal";

// ✨ 2. קומפוננטת עזר להצגת שלד הטבלה
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


export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

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
    loadStudents();
  };

  const handleDeleteStudent = useCallback(async (studentId, studentName) => {
    if (!studentId) return;

    if (window.confirm(`Are you sure you want to delete student "${studentName || 'N/A'}" (ID: ${studentId})? This action cannot be undone.`)) {
      // כאן אין צורך ב-setIsLoading(true) כי loadStudents כבר עושה זאת.
      // אבל נשמור עליו למקרה שהמחיקה תהיה ארוכה במיוחד.
      setIsLoading(true); 
      try {
        await deleteDocument("students", studentId);
        alert(`Student "${studentName || studentId}" deleted successfully.`);
        loadStudents();
      } catch (err) {
        console.error("[StudentPage:Delete] Error deleting student:", err);
        alert(`Error deleting student: ${err.message || "Unknown error"}`);
        setIsLoading(false); // כבה טעינה רק אם יש שגיאה והטעינה מחדש לא רצה
      }
    }
  }, [loadStudents]);

  return (
    <Box sx={{ padding: { xs: "1rem", md: "2rem" }, maxWidth: "1200px", margin: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h4" component="h1"> Student Management </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal} disabled={isLoading}>
          Add Student
        </Button>
      </Stack>
      
      {/* ✨ 3. LinearProgress גלובלי לעמוד */}
      <Box sx={{ height: 4, mb: 3 }}>
        {isLoading && <LinearProgress />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ✨ 4. לוגיקת תצוגה משופרת */}
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
              {students.map((student) => (
                <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    <Button variant="text" size="small" onClick={() => handleOpenEditModal(student)} sx={{ textTransform: 'none', textAlign: 'left', p: 0, justifyContent: 'flex-start' }} disabled={isLoading}>
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
              {/* אל תציג "לא נמצא" אם אנחנו באמצע טעינה */}
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

      <StudentFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        initialData={studentToEdit}
      />
    </Box>
  );
}