import React from "react";
import { IconButton, Tooltip, useTheme } from "@mui/material";

export default function ActionIconButton({
  label,
  tooltip = label,
  children,
  size = 40,
  sx,
  disabled,
  ...props
}) {
  const theme = useTheme();
  const button = (
    <IconButton
      aria-label={label}
      disabled={disabled}
      sx={{
        width: size,
        height: size,
        border: `1px solid ${theme.palette.border.soft}`,
        bgcolor: theme.palette.surface[1],
        color: "text.secondary",
        "&:hover": {
          color: "text.primary",
          borderColor: theme.palette.border.default,
          bgcolor: theme.palette.surface[2],
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </IconButton>
  );

  if (!tooltip) return button;

  return (
    <Tooltip title={tooltip}>
      <span>{button}</span>
    </Tooltip>
  );
}
