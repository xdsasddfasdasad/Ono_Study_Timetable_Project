import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import AddStudentFormModal from "./AddStudentFormModal";
import EditStudentFormModal from "./EditStudentFormModal";

const StudentManagementModal = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleAdd = (student) => {
    const newStudent = { ...student, id: Date.now() };
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleEdit = (updatedStudent) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleDelete = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditOpen(true);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Student Management</Typography>
        <Button variant="contained" onClick={() => setAddOpen(true)}>
          Add Student
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => openEditModal(student)}
                  >
                    {student.firstName} {student.lastName}
                  </Button>
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEditModal(student)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(student.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* מודלים */}
      <AddStudentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />

      <EditStudentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        student={selectedStudent}
        onSave={handleEdit}
      />
    </Box>
  );
};

export default StudentManagementModal;
