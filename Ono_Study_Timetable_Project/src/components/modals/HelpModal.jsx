import React from "react";
import { Typography, Button, Stack, Link } from "@mui/material";
import PopupModal from "../UI/PopupModal";

const HelpModal = ({ open, onClose }) => {
  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="Help & Support"
      actions={
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body1">
          Welcome to the student timetable management system! Here's how to use the system:
        </Typography>

        <Typography variant="body2">
          • Use the navigation bar to switch between Calendar, Schedule Management, and Dashboard.
        </Typography>
        <Typography variant="body2">
          • In the Student Management page, you can add, edit, or remove students.
        </Typography>
        <Typography variant="body2">
          • All changes are saved automatically and reflected in your data.
        </Typography>

        <Typography variant="body2">
          For more technical support, please visit our{" "}
          <Link href="https://support.example.com" target="_blank" rel="noopener">
            support center
          </Link>
          .
        </Typography>
      </Stack>
    </PopupModal>
  );
};

export default HelpModal;
