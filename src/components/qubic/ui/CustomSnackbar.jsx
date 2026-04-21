// src/components/CustomSnackbar.jsx
import React from "react";
import { Snackbar, Alert } from "@mui/material";

const CustomSnackbar = ({
                          open,
                          handleClose,
                          message,
                          severity = "info",
                          index = 0,          // index used for stacking
                        }) => {
  // 16px from bottom, then stack upwards (newest at the bottom)
  const verticalOffset = 16 + index * 56;

  return (
      <Snackbar
          open={open}
          onClose={handleClose}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            mb: `${verticalOffset}px`,
            maxWidth: { xs: '95vw', sm: 600 },
          }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {message}
        </Alert>
      </Snackbar>
  );
};

export default CustomSnackbar;
