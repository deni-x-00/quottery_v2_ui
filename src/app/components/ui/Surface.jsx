import React from "react";
import { Box, useTheme } from "@mui/material";

export default function Surface({
  children,
  component = "div",
  level = 1,
  border = "soft",
  interactive = false,
  sx,
  ...props
}) {
  const theme = useTheme();

  return (
    <Box
      component={component}
      sx={{
        borderRadius: 1.5,
        border: `1px solid ${theme.palette.border?.[border] || theme.palette.border.soft}`,
        bgcolor: theme.palette.surface?.[level] || theme.palette.surface[1],
        boxShadow: "none",
        ...(interactive
          ? {
              transition: "border-color 150ms ease, background-color 150ms ease, transform 150ms ease",
              "&:hover": {
                borderColor: theme.palette.border.default,
                bgcolor: theme.palette.surface[Math.min(Number(level) + 1, 4)] || theme.palette.surface[2],
                transform: "translateY(-1px)",
              },
            }
          : null),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
