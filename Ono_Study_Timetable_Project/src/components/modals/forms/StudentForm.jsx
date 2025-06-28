// src/components/modals/forms/StudentForm.jsx

import React from "react";
// Imports Material-UI components for building a structured and responsive form.
import { TextField, Stack, Grid, Box, Typography } from "@mui/material";

// This is a controlled component for creating or editing a Student user account.
// It features conditional logic to handle differences between 'add' and 'edit' modes,
// such as making the password optional during edits and disabling the ID field.
// Props:
// - formData: An object containing the current values for the student's fields.
// - errors: An object where keys match field names and values are the error messages.
// - onChange: A single callback function that the parent component provides to update its state.
// - mode: A string ('add' or 'edit') that controls the form's behavior.
export default function StudentForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add"
}) {
  // A helper function to retrieve an error message for a specific field.
  const getError = (fieldName) => errors[fieldName];

  // A boolean flag to simplify checking the current mode throughout the component.
  const isEditMode = mode === 'edit';

  // A UX improvement: the "Confirm Password" field is only shown if the user has started
  // typing in the main password field. This is achieved by casting the string to a boolean.
  const showConfirmPassword = !!formData.password;

  return (
    <Stack spacing={3}>
      {/* "Basic Information" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend">Basic Information</Typography>
        <Grid container spacing={2} mt={0.5}>
          {/* Student ID Card (Hebrew: "תעודת זהות") */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="ID Card" name="studentIdCard" value={formData.studentIdCard || ""} onChange={onChange}
              error={!!getError('studentIdCard')}
              // The helper text changes based on the mode.
              helperText={getError('studentIdCard') || (isEditMode ? 'Cannot be edited' : 'Required, 9 digits, unique')}
              fullWidth required variant="outlined" size="small"
              // The student's ID is a primary identifier and should not be changed after creation.
              disabled={isEditMode}
            />
          </Grid>
          {/* This empty Grid item acts as a spacer in the two-column layout. */}
          <Grid item xs={12} sm={6}></Grid>
          
          {/* First Name (Hebrew: "שם פרטי") */}
          <Grid item xs={12} sm={6}>
            <TextField label="First Name" name="firstName" value={formData.firstName || ""} onChange={onChange}
              error={!!getError('firstName')} helperText={getError('firstName') || ' '}
              fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
            />
          </Grid>
          {/* Last Name (Hebrew: "שם משפחה") */}
          <Grid item xs={12} sm={6}>
            <TextField label="Last Name" name="lastName" value={formData.lastName || ""} onChange={onChange}
              error={!!getError('lastName')} helperText={getError('lastName') || ' '}
              fullWidth required variant="outlined" size="small"
            />
          </Grid>
          {/* Email (Hebrew: "אימייל") */}
          <Grid item xs={12} sm={6}>
            <TextField label="Email" name="email" type="email" value={formData.email || ""} onChange={onChange}
              error={!!getError('email')} helperText={getError('email') || ' '}
              fullWidth required variant="outlined" size="small"
            />
          </Grid>
          {/* Phone (Optional) (Hebrew: "טלפון (אופציונלי)") */}
          <Grid item xs={12} sm={6}>
            <TextField label="Phone (Optional)" name="phone" type="tel" value={formData.phone || ""} onChange={onChange}
              error={!!getError('phone')} helperText={getError('phone') || ' '}
              fullWidth variant="outlined" size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {/* "Account Information" Section */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend">Account Information</Typography>
        <Grid container spacing={2} mt={0.5}>
          {/* Username (Hebrew: "שם משתמש") */}
          <Grid item xs={12} sm={6}>
            <TextField label="Username" name="username" value={formData.username || ""} onChange={onChange}
              error={!!getError('username')} helperText={getError('username') || ' '}
              fullWidth required variant="outlined" size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}></Grid>

          {/* Password (Hebrew: "סיסמה") */}
          <Grid item xs={12} sm={6}>
            <TextField
              // The label changes to indicate the password is optional in edit mode.
              label={isEditMode ? "New Password (Optional)" : "Password"}
              name="password" type="password"
              value={formData.password || ""} onChange={onChange} error={!!getError('password')}
              // Helper text also changes to guide the user.
              helperText={getError('password') || (isEditMode ? 'Leave blank to keep the current password' : 'Required, at least 6 characters')}
              // The field is only required when creating a new student.
              fullWidth required={!isEditMode} variant="outlined" size="small"
              // `autoComplete="new-password"` tells the browser this is a field for setting a new password,
              // preventing it from trying to autofill the user's current saved password.
              autoComplete="new-password"
            />
          </Grid>
          
          {/* Confirm Password (Hebrew: "וידוא סיסמה") */}
          {/* This field is only rendered when the user has typed something into the password field. */}
          {showConfirmPassword && (
            <Grid item xs={12} sm={6}>
              <TextField label="Confirm Password" name="confirmPassword" type="password"
                value={formData.confirmPassword || ""} onChange={onChange} error={!!getError('confirmPassword')}
                helperText={getError('confirmPassword') || ' '}
                fullWidth required
                variant="outlined" size="small" autoComplete="new-password"
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}