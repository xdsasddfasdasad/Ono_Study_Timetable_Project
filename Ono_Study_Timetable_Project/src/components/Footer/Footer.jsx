// src/components/Footer/Footer.jsx

import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Stack } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CopyrightIcon from '@mui/icons-material/Copyright';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[900],
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1} alignItems="center">
          <Typography variant="h6" component="div" gutterBottom>
            <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Ono Timetable Project
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 600 }}
          >
            Empowering students with an organized and efficient academic schedule management platform.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            <CopyrightIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {CURRENT_YEAR} – Built with ❤️ by the Triple I Dev Team
          </Typography>
          <MuiLink
            href="https://github.com/xdsasddfasdasad/Ono_Study_Timetable_Project"
            target="_blank"
            rel="noopener"
            underline="hover"
            color="primary"
            sx={{ mt: 1 }}
          >
            View Source on GitHub
          </MuiLink>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
