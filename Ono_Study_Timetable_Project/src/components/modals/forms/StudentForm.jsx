// src/components/modals/forms/StudentForm.jsx

import React from "react";
import { TextField, Stack, Grid, Box, Typography } from "@mui/material";

export default function StudentForm({
  formData = {},
  errors = {},
  onChange,
  mode = "add"
}) {
  const getError = (fieldName) => errors[fieldName];
  const showConfirmPassword = mode === 'add' || (mode === 'edit' && !!formData.password);

  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend">Basic Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={6}>
                <TextField
                    label="Student ID" name="id" value={formData.id || ""} onChange={onChange}
                    error={!!getError('id')} helperText={getError('id') || ' '}
                    fullWidth required disabled={mode === 'edit'} variant="outlined" size="small"
                    InputProps={{ readOnly: mode === 'edit' }}
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="First Name" name="firstName" value={formData.firstName || ""} onChange={onChange}
                    error={!!getError('firstName')} helperText={getError('firstName') || ' '}
                    fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="Last Name" name="lastName" value={formData.lastName || ""} onChange={onChange}
                    error={!!getError('lastName')} helperText={getError('lastName') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="Email" name="email" type="email" value={formData.email || ""} onChange={onChange}
                    error={!!getError('email')} helperText={getError('email') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="Phone (Optional)" name="phone" type="tel" value={formData.phone || ""} onChange={onChange}
                    error={!!getError('phone')} helperText={getError('phone') || ' '}
                    fullWidth variant="outlined" size="small"
                />
           </Grid>
        </Grid>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend" /* ... */ >Account Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={6}>
                <TextField label="Username" name="username" value={formData.username || ""} onChange={onChange}
                    error={!!getError('username')} helperText={getError('username') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid>
           <Grid item xs={12} sm={6}>
                <TextField label={mode === 'add' ? "Password" : "New Password (Optional)"} name="password" type="password"
                    value={formData.password || ""} onChange={onChange} error={!!getError('password')}
                    helperText={getError('password') || (mode === 'add' ? 'Min 6 characters' : 'Leave blank to keep current')}
                    fullWidth required={mode === 'add'} variant="outlined" size="small" autoComplete="new-password"
                />
           </Grid>
           { showConfirmPassword && (
                <Grid item xs={12} sm={6}>
                    <TextField label="Confirm Password" name="confirmPassword" type="password"
                        value={formData.confirmPassword || ""} onChange={onChange} error={!!getError('confirmPassword')}
                        helperText={getError('confirmPassword') || ' '}
                        fullWidth required={!!formData.password}
                        variant="outlined" size="small" autoComplete="new-password"
                    />
                </Grid>
           )}
        </Grid>
      </Box>
    </Stack>
  );
}