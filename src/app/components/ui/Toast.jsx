import React from "react";
import { Alert, Box, CircularProgress, IconButton, Snackbar, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const SEVERITY_META = {
  success: { icon: CheckCircleIcon, tone: "success" },
  error: { icon: ErrorOutlineIcon, tone: "error" },
  warning: { icon: WarningAmberIcon, tone: "warning" },
  info: { icon: InfoOutlinedIcon, tone: "primary" },
};

export default function Toast({
  open,
  handleClose,
  message,
  severity = "info",
  loading = false,
  autoHideDuration,
  index = 0,
}) {
  const theme = useTheme();
  const meta = SEVERITY_META[severity] || SEVERITY_META.info;
  const tone = theme.palette[meta.tone]?.main || theme.palette.primary.main;
  const Icon = meta.icon;
  const verticalOffset = 16 + index * 64;

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={autoHideDuration === undefined ? (loading ? null : 6000) : autoHideDuration}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{
        mb: `${verticalOffset}px`,
        maxWidth: { xs: "calc(100vw - 24px)", sm: 520 },
      }}
    >
      <Alert
        variant="outlined"
        icon={false}
        action={
          <IconButton size="small" onClick={handleClose} sx={{ color: "text.secondary" }}>
            <CloseIcon sx={{ fontSize: 17 }} />
          </IconButton>
        }
        sx={{
          width: "100%",
          alignItems: "flex-start",
          borderRadius: 1.5,
          borderColor: alpha(tone, 0.28),
          bgcolor: alpha(tone, 0.08),
          color: "text.primary",
          boxShadow: "0 18px 44px rgba(0,0,0,0.34)",
          backdropFilter: "blur(14px)",
          "& .MuiAlert-message": {
            width: "100%",
            minWidth: 0,
            py: 0.25,
          },
          "& .MuiAlert-action": {
            pt: 0,
            pl: 1,
            mr: -0.5,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.1, minWidth: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              mt: 0.1,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              bgcolor: alpha(tone, 0.13),
              color: tone,
            }}
          >
            {loading ? <CircularProgress size={15} color="inherit" /> : <Icon sx={{ fontSize: 17 }} />}
          </Box>
          <Typography
            variant="body2"
            sx={{
              minWidth: 0,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontWeight: 750,
              lineHeight: 1.45,
            }}
          >
            {message}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
}
