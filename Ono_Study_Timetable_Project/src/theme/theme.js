// src/theme/theme.js

// This file defines the custom theme for the entire application using Material-UI's theming capabilities.
// Centralizing the theme ensures a consistent look and feel (colors, fonts, etc.) across all components
// and makes it easy to update the application's design from a single source of truth.

import { createTheme } from "@mui/material/styles";

// `createTheme` is a function from Material-UI that takes a theme configuration object
// and returns a complete, fully-formed theme object that can be used by the ThemeProvider.
const theme = createTheme({
  // The `palette` object defines the color scheme of the application.
  palette: {
    // `mode: "light"` sets the default theme to a light background with dark text.
    // This can be toggled to "dark" for a dark mode.
    mode: "light",
    // `primary` defines the main brand color, used for primary actions, buttons, headers, etc.
    primary: {
      main: "#1976d2", // A classic Material-UI blue. (Original comment: כחול MUI קלאסי)
    },
    // `secondary` defines the accent color, used for secondary actions and highlighting.
    secondary: {
      main: "#9c27b0", // A purple color.
    },
    // `error` defines the color used for error messages, validation failures, and destructive actions.
    error: {
      main: "#d32f2f", // A standard red color.
    },
  },
  // The `typography` object defines the font settings for the application.
  typography: {
    // `fontFamily` sets the default font stack. The browser will attempt to use the fonts
    // in the order they are listed.
    fontFamily: `'Roboto', 'Segoe UI', sans-serif`,
  },
});

// The created theme object is exported to be used by the `ThemeProvider`
// at the root of the application (typically in App.jsx or main.jsx).
export default theme;