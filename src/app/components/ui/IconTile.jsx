import React from "react";
import { Box, useTheme } from "@mui/material";

const SIZE_MAP = {
  sm: 32,
  md: 42,
  lg: 52,
};

export default function IconTile({
  children,
  size = "md",
  tone = "primary",
  color: colorOverride,
  sx,
}) {
  const theme = useTheme();
  const resolvedSize = typeof size === "number" ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const color = colorOverride || (tone === "muted"
    ? theme.palette.text.secondary
    : theme.palette[tone]?.main || theme.palette.primary.main);

  return (
    <Box
      sx={{
        width: resolvedSize,
        height: resolvedSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.border.soft}`,
        bgcolor: theme.palette.surface[1],
        color,
        flexShrink: 0,
        "& svg": { fontSize: Math.max(16, Math.round(resolvedSize * 0.56)) },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
