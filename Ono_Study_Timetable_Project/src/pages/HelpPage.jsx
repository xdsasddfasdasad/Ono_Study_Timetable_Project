import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import HelpModal from "../components/modals/HelpModal";

const HelpPage = () => {
  const [open, setOpen] = useState(true); // מציג את המודל ברירת מחדל

  return (
    <Box sx={{ padding: 4 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Help
      </Button>

      <HelpModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};

export default HelpPage;
