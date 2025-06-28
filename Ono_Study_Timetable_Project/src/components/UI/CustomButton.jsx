// /src/components/UI/CustomButton.jsx
import React from "react";
// Imports the base Button component from the Material-UI library.
import { Button } from "@mui/material";

// This is a custom, reusable button component that acts as a thin wrapper
// around Material-UI's Button. The primary goal is to enforce a consistent
// style for primary action buttons across the entire application.
// By default, it sets the `variant` to "contained".
// Props:
// - children: The content to be displayed inside the button (e.g., text, an icon).
// - onClick: The function to be executed when the button is clicked.
// - ...props: This "rest props" pattern is a key feature. It allows any other valid
//   Material-UI Button prop (like `color`, `size`, `disabled`, `sx`, `startIcon`, etc.)
//   to be passed down to the underlying Button component. This makes our CustomButton
//   both consistent and highly flexible.
export default function CustomButton({ children, onClick, ...props }) {
  return (
    // Renders the base Material-UI Button.
    <Button
      // Sets the default appearance to "contained" for a solid, primary look.
      variant="contained"
      onClick={onClick}
      // Spreads all other passed-in props onto the Button component.
      {...props}
    >
      {children}
    </Button>
  );
}