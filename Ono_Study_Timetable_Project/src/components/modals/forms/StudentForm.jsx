// src/components/modals/forms/StudentForm.jsx

import React from "react";
import { TextField, Stack, Grid, Box, Typography } from "@mui/material";

// Presentation component - receives data and errors, calls onChange
export default function StudentForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add"
}) {

  // Helper to get error message for a specific field
  const getError = (fieldName) => errors[fieldName];

  // Determine if the confirm password field should be visible
  // Visible when adding, OR when editing AND the password field has been typed into
  const showConfirmPassword = mode === 'add' || (mode === 'edit' && !!formData.password);

  return (
    <Stack spacing={3}>
      {/* --- Basic Information --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" /* ... */ >Basic Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           {/* ID Field */}
           <Grid item xs={12} sm={6}>
                <TextField
                    label="Student ID" name="id" value={formData.id || ""} onChange={onChange}
                    error={!!getError('id')} helperText={getError('id') || ' '}
                    fullWidth required disabled={mode === 'edit'} variant="outlined" size="small"
                    InputProps={{ readOnly: mode === 'edit' }}
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid> {/* Spacer */}
           {/* First Name */}
           <Grid item xs={12} sm={6}>
                <TextField label="First Name" name="firstName" value={formData.firstName || ""} onChange={onChange}
                    error={!!getError('firstName')} helperText={getError('firstName') || ' '}
                    fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
                />
           </Grid>
           {/* Last Name */}
           <Grid item xs={12} sm={6}>
                <TextField label="Last Name" name="lastName" value={formData.lastName || ""} onChange={onChange}
                    error={!!getError('lastName')} helperText={getError('lastName') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           {/* Email */}
           <Grid item xs={12} sm={6}>
                <TextField label="Email" name="email" type="email" value={formData.email || ""} onChange={onChange}
                    error={!!getError('email')} helperText={getError('email') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           {/* Phone */}
           <Grid item xs={12} sm={6}>
                <TextField label="Phone (Optional)" name="phone" type="tel" value={formData.phone || ""} onChange={onChange}
                    error={!!getError('phone')} helperText={getError('phone') || ' '}
                    fullWidth variant="outlined" size="small"
                />
           </Grid>
        </Grid>
      </Box>

      {/* --- Account Information --- */}
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" /* ... */ >Account Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           {/* Username */}
           <Grid item xs={12} sm={6}>
                <TextField label="Username" name="username" value={formData.username || ""} onChange={onChange}
                    error={!!getError('username')} helperText={getError('username') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid> {/* Spacer */}
           {/* Password */}
           <Grid item xs={12} sm={6}>
                <TextField label={mode === 'add' ? "Password" : "New Password (Optional)"} name="password" type="password"
                    value={formData.password || ""} onChange={onChange} error={!!getError('password')}
                    helperText={getError('password') || (mode === 'add' ? 'Min 6 characters' : 'Leave blank to keep current')}
                    fullWidth required={mode === 'add'} variant="outlined" size="small" autoComplete="new-password"
                />
           </Grid>
           {/* Confirm Password */}
           {/* ✅ Render conditionally based on showConfirmPassword */}
           { showConfirmPassword && (
                <Grid item xs={12} sm={6}>
                    <TextField label="Confirm Password" name="confirmPassword" type="password"
                        value={formData.confirmPassword || ""} onChange={onChange} error={!!getError('confirmPassword')}
                        helperText={getError('confirmPassword') || ' '}
                        fullWidth required={!!formData.password} // Required only if password is not empty
                        variant="outlined" size="small" autoComplete="new-password"
                    />
                </Grid>
           )}
        </Grid>
      </Box>
    </Stack>
  );
}