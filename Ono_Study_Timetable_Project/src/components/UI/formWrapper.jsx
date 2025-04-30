// src/components/UI/FormWrapper.jsx

import React from "react";
import { Box } from "@mui/material";

export default function FormWrapper({ children }) {
  return (
    <Box sx={{ p: 2 }}>
      {children}
    </Box>
  );
}