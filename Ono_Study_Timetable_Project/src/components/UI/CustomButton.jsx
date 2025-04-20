import React from "react";
import { Button } from "@mui/material";

export default function CustomButton({ children, onClick, ...props }) {
  return (
    <Button variant="contained" onClick={onClick} {...props}>
      {children}
    </Button>
  );
}
