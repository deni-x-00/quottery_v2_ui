// src/components/CustomSnackbar.jsx
import React from "react";
import { Snackbar, Alert, CircularProgress } from "@mui/material";

const CustomSnackbar = ({
                          open,
                          handleClose,
                           message,
                           severity = "info",
                           loading = false,
                           autoHideDuration,
                           index = 0,          // index used for stacking
                         }) => {
  // 16px from bottom, then stack upwards (newest at the bottom)
  const verticalOffset = 16 + index * 56;

  return (
      <Snackbar
          open={open}
          onClose={handleClose}
          autoHideDuration={autoHideDuration === undefined ? 6000 : autoHideDuration}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            mb: `${verticalOffset}px`,
            maxWidth: { xs: '95vw', sm: 600 },
          }}
      >
        <Alert
            onClose={handleClose}
            severity={severity}
            icon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{ width: "100%", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
        >
          {message}
        </Alert>
      </Snackbar>
  );
};

export default CustomSnackbar;
