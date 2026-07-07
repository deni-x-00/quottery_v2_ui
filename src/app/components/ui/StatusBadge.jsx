import React from "react";
import { Box, alpha, useTheme } from "@mui/material";

const STATUS_META = {
  open: { label: "Open", color: "open" },
  active: { label: "Open", color: "open" },
  closed: { label: "Closed", color: "closed" },
  resolved: { label: "Resolved", color: "resolved" },
  finalized: { label: "Resolved", color: "resolved" },
  archived: { label: "Archived", color: "archive" },
  cancelled: { label: "Cancelled", color: "cancelled" },
  canceled: { label: "Canceled", color: "cancelled" },
  pending: { label: "Pending", color: "open" },
  win: { label: "Win", color: "resolved" },
  lose: { label: "Lose", color: "cancelled" },
  matched: { label: "Matched", color: "resolved" },
  partially_matched: { label: "Partially matched", color: "closed" },
  removed_by_user: { label: "Canceled", color: "closed" },
  removed_by_system: { label: "Returned", color: "open" },
};

function humanizeStatus(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusBadge({ status, label, size = "sm", sx }) {
  const theme = useTheme();
  const key = String(status || "").toLowerCase();
  const meta = STATUS_META[key] || { label: label || humanizeStatus(status) || "-", color: "archive" };
  const color = theme.palette.status?.[meta.color] || theme.palette.text.secondary;
  const compact = size === "xs";
  const isLight = theme.palette.mode === "light";

  return (
    <Box
      component="span"
      aria-label={`Status: ${label || meta.label}`}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: compact ? 24 : 28,
        px: compact ? 1 : 1.25,
        borderRadius: 999,
        border: `1px solid ${alpha(color, isLight ? 0.42 : 0.35)}`,
        bgcolor: alpha(color, isLight ? 0.12 : 0.1),
        color,
        fontSize: compact ? "0.72rem" : "0.78rem",
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...sx,
      }}
    >
      {label || meta.label}
    </Box>
  );
}
