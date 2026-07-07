import React from "react";
import { Box } from "@mui/material";
import { PAGE_GUTTER_X, PAGE_MAX_WIDTH } from "./layout";

export default function PageShell({
  children,
  maxWidth = PAGE_MAX_WIDTH,
  top = { xs: 4, md: 6 },
  bottom = 8,
  sx,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        pt: top,
        px: PAGE_GUTTER_X,
        mb: bottom,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
