import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import InfoModal from "../components/modals/InfoModal";

const SystemInfoDashboardPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ padding: 4 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        View System Info
      </Button>

      <InfoModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
};

export default SystemInfoDashboardPage;
