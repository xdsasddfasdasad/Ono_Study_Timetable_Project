import React, { useState, useEffect } from "react";
import {
  Box, Button, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography, Stack,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import AddStudentFormModal from "./AddStudentFormModal";
import EditStudentFormModal from "./EditStudentFormModal";

const StudentManagementModal = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("students");
    if (stored) {
      setStudents(JSON.parse(stored));
    }
  }, []);

  const saveToStorage = (data) => {
    localStorage.setItem("students", JSON.stringify(data));
  };

  const handleAdd = (student) => {
    const updated = [...students, student];
    setStudents(updated);
    saveToStorage(updated);
  };

  const handleEdit = (updatedStudent) => {
    const updated = students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    setStudents(updated);
    saveToStorage(updated);
  };

  const handleDelete = (id) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    saveToStorage(updated);
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
                  <Button variant="text" onClick={() => openEditModal(student)}>
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

      <AddStudentFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        existingStudents={students}
      />

      <EditStudentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        student={selectedStudent}
        onSave={handleEdit}
        existingStudents={students}
      />
    </Box>
  );
};

export default StudentManagementModal;
