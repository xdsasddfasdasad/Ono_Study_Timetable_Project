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
  const isEditMode = mode === 'edit';

  // ✅ Show confirm password field only if user starts typing in the password field
  const showConfirmPassword = !!formData.password;

  return (
    <Stack spacing={3}>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend">Basic Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={6}>
                <TextField
                    label="תעודת זהות" name="studentIdCard" value={formData.studentIdCard || ""} onChange={onChange}
                    error={!!getError('studentIdCard')} 
                    helperText={getError('studentIdCard') || (isEditMode ? 'לא ניתן לערוך' : 'חובה, 9 ספרות, ייחודי')}
                    fullWidth required variant="outlined" size="small"
                    // ✅ CHANGED: Disabled during edit mode according to rules
                    disabled={isEditMode}
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="שם פרטי" name="firstName" value={formData.firstName || ""} onChange={onChange}
                    error={!!getError('firstName')} helperText={getError('firstName') || ' '}
                    fullWidth required autoFocus={mode === 'add'} variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="שם משפחה" name="lastName" value={formData.lastName || ""} onChange={onChange}
                    error={!!getError('lastName')} helperText={getError('lastName') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="אימייל" name="email" type="email" value={formData.email || ""} onChange={onChange}
                    error={!!getError('email')} helperText={getError('email') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}>
                <TextField label="טלפון (אופציונלי)" name="phone" type="tel" value={formData.phone || ""} onChange={onChange}
                    error={!!getError('phone')} helperText={getError('phone') || ' '}
                    fullWidth variant="outlined" size="small"
                />
           </Grid>
        </Grid>
      </Box>
      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, position: 'relative' }}>
        <Typography variant="overline" component="legend">Account Information</Typography>
        <Grid container spacing={2} mt={0.5}>
           <Grid item xs={12} sm={6}>
                <TextField label="שם משתמש" name="username" value={formData.username || ""} onChange={onChange}
                    error={!!getError('username')} helperText={getError('username') || ' '}
                    fullWidth required variant="outlined" size="small"
                />
           </Grid>
           <Grid item xs={12} sm={6}></Grid>
           <Grid item xs={12} sm={6}>
                <TextField label={isEditMode ? "סיסמה חדשה (אופציונלי)" : "סיסמה"} name="password" type="password"
                    value={formData.password || ""} onChange={onChange} error={!!getError('password')}
                    helperText={getError('password') || (isEditMode ? 'השאר ריק כדי לשמור על הסיסמה הנוכחית' : 'חובה, לפחות 6 תווים')}
                    fullWidth required={!isEditMode} variant="outlined" size="small" autoComplete="new-password"
                />
           </Grid>
           {/* ✅ CHANGED: Simplified condition to show the field */}
           {showConfirmPassword && (
                <Grid item xs={12} sm={6}>
                    <TextField label="וידוא סיסמה" name="confirmPassword" type="password"
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