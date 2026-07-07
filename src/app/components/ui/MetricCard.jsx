import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Surface from "./Surface";

export default function MetricCard({
  label,
  value,
  secondaryValue,
  tone = "default",
  icon,
  compact = false,
  align = "left",
  multiline = false,
  sx,
}) {
  const theme = useTheme();
  const toneColor = {
    default: theme.palette.text.primary,
    cyan: theme.palette.primary.main,
    yes: theme.palette.market.yesText,
    no: theme.palette.market.noText,
    muted: theme.palette.text.secondary,
  }[tone] || theme.palette.text.primary;

  return (
    <Surface
      sx={{
        minWidth: 0,
        p: compact ? 1.5 : 2,
        textAlign: align,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: 1,
          mb: 0.75,
          color: "text.secondary",
        }}
      >
        {icon}
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        className="stat"
        sx={{
          color: toneColor,
          fontSize: compact ? "1rem" : "1.15rem",
          fontWeight: 900,
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: multiline ? "normal" : "nowrap",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
      {secondaryValue !== undefined && secondaryValue !== null && secondaryValue !== "" && (
        <Typography
          className="stat"
          sx={{
            color: toneColor,
            fontSize: compact ? "0.82rem" : "0.9rem",
            fontWeight: 800,
            lineHeight: 1.25,
            mt: 0.35,
            opacity: 0.82,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {secondaryValue}
        </Typography>
      )}
    </Surface>
  );
}
