// src/components/Footer/Footer.jsx

import React from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { Copyright } from '@mui/icons-material';

function CopyrightText() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright '}
      <MuiLink color="inherit" href="https://mui.com/">
        Your Website/App Name
      </MuiLink>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2, 
        mt: 'auto', 
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body1" align="center" gutterBottom>
          Ono Timetable Project
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
          sx={{mb: 1}}
        >
          Helping students manage their academic schedule effectively.
        </Typography>
        <CopyrightText />
      </Container>
    </Box>
  );
};

export default Footer;