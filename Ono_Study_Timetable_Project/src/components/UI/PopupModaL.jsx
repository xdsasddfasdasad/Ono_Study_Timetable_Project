// src/components/UI/PopupModal.jsx

import React from "react";
// Imports the necessary components from Material-UI for building a dialog box.
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from "@mui/material";
// Imports the icon for the close button.
import CloseIcon from "@mui/icons-material/Close";

// This is a generic, reusable modal component that provides a consistent structure
// and appearance for all pop-up dialogs throughout the application. It handles the
// boilerplate of creating a dialog with a title, a close button, a content area,
// and an optional actions footer.
// Props:
// - open: A boolean that controls whether the dialog is visible.
// - onClose: A callback function that is triggered when the dialog requests to be closed
//   (e.g., by clicking the 'X' button or pressing the Escape key).
// - title: The text to be displayed in the header of the modal.
// - children: The main content of the modal. This can be any valid React node (e.g., a form, text, etc.).
// - actions: An optional prop that can contain React nodes (typically buttons) to be rendered in the footer.
const PopupModal = ({ open, onClose, title, children, actions, ...props }) => {
  return (
    // The Dialog component from Material-UI is the main container for the modal.
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth // The dialog will use the full width of its container.
      maxWidth="sm" // Sets a default max-width, which can be overridden by props.
      // The rest props (...) allow passing any other valid Dialog prop, like a different `maxWidth`.
      {...props}
    >
      {/* DialogTitle provides a styled header area. */}
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Typography variant="h6" component="span">{title}</Typography>
        {/* The close button is positioned absolutely within the title bar for a standard UI pattern. */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500] // Uses a neutral color from the theme.
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* DialogContent is the main body of the modal. The `dividers` prop adds
          subtle top and bottom borders to separate it from the header and footer. */}
      <DialogContent dividers>
        {children}
      </DialogContent>
      
      {/* The DialogActions footer is only rendered if the `actions` prop is provided.
          This makes the footer optional and keeps the component clean. */}
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PopupModal;