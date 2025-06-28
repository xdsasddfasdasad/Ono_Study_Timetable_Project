// src/components/Footer/Footer.jsx

import React from 'react';
// Imports Material-UI components used for layout and typography.
// - Box: A generic container for applying custom styles.
// - Container: Centers and constrains the content width.
// - Typography: For rendering text with consistent styling.
// - MuiLink: A styled link component.
// - Stack: For arranging items in a one-dimensional stack (vertical by default).
import { Box, Container, Typography, Link as MuiLink, Stack } from '@mui/material';
// Imports icons to be used within the footer.
import SchoolIcon from '@mui/icons-material/School';
import CopyrightIcon from '@mui/icons-material/Copyright';

// A constant to hold the current year, ensuring the copyright is always up-to-date.
const CURRENT_YEAR = new Date().getFullYear();

// This is a stateless functional component that renders the application's footer.
// It provides key information like the project name, copyright, and a link to the source code.
const Footer = () => {
  return (
    // The main footer element is a 'Box' with the component prop set to 'footer' for semantic HTML.
    <Box
      component="footer"
      // The 'sx' prop is used for applying custom CSS styles.
      sx={{
        // Sets vertical (py) and horizontal (px) padding.
        py: 4,
        px: 2,
        // 'mt: auto' is a crucial style for a "sticky footer". It pushes the footer to the bottom
        // of the viewport when the page content is shorter than the screen height.
        mt: 'auto',
        // Sets the background color dynamically based on the current theme mode (light or dark).
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[900],
        // Adds a subtle border line at the top of the footer to separate it from page content.
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* The Container component centers the content horizontally and sets a max-width. */}
      <Container maxWidth="lg">
        {/* The Stack component simplifies laying out the footer content vertically with consistent spacing. */}
        <Stack spacing={1} alignItems="center">
          {/* The main project title. */}
          <Typography variant="h6" component="div" gutterBottom>
            <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Ono Timetable Project
          </Typography>
          {/* A short tagline or description for the project. */}
          <Typography
            variant="subtitle1"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 600 }}
          >
            Empowering students with an organized and efficient academic schedule management platform.
          </Typography>
          {/* The copyright notice. */}
          <Typography variant="body2" color="text.secondary" align="center">
            <CopyrightIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {CURRENT_YEAR} – Built with ❤️ by the Triple I Dev Team
          </Typography>
          {/* A link to the project's source code on GitHub. */}
          <MuiLink
            href="https://github.com/xdsasddfasdasad/Ono_Study_Timetable_Project"
            // 'target="_blank"' opens the link in a new tab.
            target="_blank"
            // 'rel="noopener"' is a security best practice for links opening in a new tab.
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