import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import HelpModal from "../components/modals/HelpModal.jsx";

const HelpPage = () => {
  const [open, setOpen] = useState(true);

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
