import React from "react";
import { Box } from "@mui/material";
import MetricCard from "./MetricCard";

const DEFAULT_COLUMNS = {
  xs: "1fr",
  sm: "repeat(2, minmax(0, 1fr))",
  md: "repeat(4, minmax(0, 1fr))",
};

export default function MetricGrid({
  metrics,
  columns = DEFAULT_COLUMNS,
  gap = 1.25,
  compact = false,
  sx,
  cardSx,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap,
        ...sx,
      }}
    >
      {(metrics || []).map((metric) => (
        <MetricCard
          key={metric.key || metric.label}
          label={metric.label}
          value={metric.value}
          secondaryValue={metric.secondaryValue}
          tone={metric.tone}
          icon={metric.icon}
          align={metric.align}
          multiline={metric.multiline}
          compact={metric.compact ?? compact}
          sx={{ ...cardSx, ...metric.sx }}
        />
      ))}
    </Box>
  );
}
