import React from "react";
import { Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import IconTile from "./IconTile";
import Surface from "./Surface";

const TONE_ICON = {
  default: SearchOffIcon,
  info: InfoOutlinedIcon,
  warning: WarningAmberIcon,
  error: ErrorOutlineIcon,
};

export default function EmptyState({
  icon,
  title = "No results",
  description,
  action,
  tone = "default",
  compact = false,
  sx,
}) {
  const theme = useTheme();
  const toneColor = tone === "error"
    ? theme.palette.error.main
    : tone === "warning"
      ? theme.palette.warning.main
      : tone === "info"
        ? theme.palette.primary.main
        : theme.palette.text.secondary;
  const Icon = TONE_ICON[tone] || TONE_ICON.default;

  return (
    <Surface
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: compact ? 148 : 240,
        p: compact ? { xs: 2.5, sm: 3 } : { xs: 3, sm: 5 },
        backgroundImage: `radial-gradient(circle at 50% 0%, ${alpha(toneColor, 0.08)}, transparent 42%)`,
        ...sx,
      }}
    >
      <IconTile
        size={compact ? 42 : 52}
        color={toneColor}
        sx={{
          mb: compact ? 1.25 : 2,
          border: `1px solid ${alpha(toneColor, 0.22)}`,
          bgcolor: alpha(toneColor, 0.08),
        }}
      >
        {icon || <Icon />}
      </IconTile>
      <Typography variant={compact ? "body1" : "h6"} sx={{ fontWeight: 900, mb: description ? 0.75 : 0 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 460, mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Surface>
  );
}
