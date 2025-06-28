// src/components/UI/FormWrapper.jsx

import React from "react";
// Imports the Box component from Material-UI, which is a generic container for layout and styling.
import { Box } from "@mui/material";

// This is a simple presentational component that acts as a standardized container for form content.
// Its sole purpose is to wrap its children in a Box with consistent padding.
// Using this component ensures that all forms or sections of forms across the application
// have the same spacing, leading to a more polished and consistent user interface.
// Props:
// - children: The content to be rendered inside the wrapper, typically the form fields and layout elements.
export default function FormWrapper({ children }) {
  return (
    // Renders a Material-UI Box component.
    // The `sx` prop is used for applying custom styles.
    // `p: 2` is a shorthand for `padding: theme.spacing(2)`, which typically translates to 16px.
    <Box sx={{ p: 2 }}>
      {children}
    </Box>
  );
}