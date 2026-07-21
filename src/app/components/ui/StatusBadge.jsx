import React from "react";
import { Box, alpha, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

const STATUS_META = {
  open: { labelKey: "status.open", color: "open" },
  active: { labelKey: "status.open", color: "open" },
  closed: { labelKey: "status.closed", color: "closed" },
  resolved: { labelKey: "status.resolved", color: "resolved" },
  finalized: { labelKey: "status.resolved", color: "resolved" },
  archived: { labelKey: "status.archived", color: "archive" },
  cancelled: { labelKey: "status.cancelled", color: "cancelled" },
  canceled: { labelKey: "status.canceled", color: "cancelled" },
  pending: { labelKey: "status.pending", color: "open" },
  win: { labelKey: "status.win", color: "resolved" },
  lose: { labelKey: "status.lose", color: "cancelled" },
  matched: { labelKey: "status.matched", color: "resolved" },
  partially_matched: { labelKey: "status.partiallyMatched", color: "closed" },
  removed_by_user: { labelKey: "status.canceled", color: "closed" },
  removed_by_system: { labelKey: "status.returned", color: "open" },
};

function humanizeStatus(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusBadge({ status, label, size = "sm", sx }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const key = String(status || "").toLowerCase();
  const meta = STATUS_META[key] || { color: "archive" };
  const visibleLabel = label || (meta.labelKey ? t(meta.labelKey) : humanizeStatus(status) || "-");
  const color = theme.palette.status?.[meta.color] || theme.palette.text.secondary;
  const compact = size === "xs";
  const isLight = theme.palette.mode === "light";

  return (
    <Box
      component="span"
      aria-label={t("status.label", { status: visibleLabel })}
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
      {visibleLabel}
    </Box>
  );
}
