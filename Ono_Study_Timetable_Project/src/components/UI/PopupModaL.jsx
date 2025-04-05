import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const PopupModal = ({ open, onClose, title, children, actions }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Typography variant="h6" component="span">{title}</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>


      <DialogContent dividers>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PopupModal;
