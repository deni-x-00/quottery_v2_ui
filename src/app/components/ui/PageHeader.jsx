import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import IconTile from "./IconTile";

export default function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  children,
  sx,
  descriptionSx,
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "flex-start" }}
      sx={{ mb: 2.5, ...sx }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
        {icon && (
          <IconTile>
            {icon}
          </IconTile>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {eyebrow && (
            <Typography
              sx={{
                color: "primary.main",
                fontSize: "0.72rem",
                fontWeight: 900,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                mb: 0.75,
              }}
            >
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h2" sx={{ lineHeight: 1 }}>
            {title}
          </Typography>
          {description && (
            <Typography sx={{ color: "text.secondary", mt: 1, maxWidth: 640, lineHeight: 1.55, ...descriptionSx }}>
              {description}
            </Typography>
          )}
          {children}
        </Box>
      </Stack>

      {actions && (
        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Stack>
  );
}
