import React from "react";
import { Typography, Stack, Divider, Button } from "@mui/material";
import PopupModal from "../UI/PopupModal";

const InfoModal = ({ open, onClose }) => {
  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title="System Information"
      actions={
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      }
    >
      <Stack spacing={2}>
        <Typography variant="body1">
          This dashboard provides an overview of the system status and key statistics.
        </Typography>

        <Divider />

        <Typography variant="body2">
          • 📚 Total Students: <strong>123</strong><br />
          • 📅 Scheduled Events Today: <strong>8</strong><br />
          • 📈 Active Users: <strong>12</strong><br />
          • ✅ System Status: <strong>Operational</strong>
        </Typography>

        <Divider />

        <Typography variant="body2">
          Tips:
        </Typography>
        <Typography variant="body2" sx={{ pl: 2 }}>
          • Use the student management page to keep your student list updated.<br />
          • Encourage students to check their calendar regularly.<br />
          • You can integrate Firebase analytics for deeper insights.
        </Typography>
      </Stack>
    </PopupModal>
  );
};

export default InfoModal;
