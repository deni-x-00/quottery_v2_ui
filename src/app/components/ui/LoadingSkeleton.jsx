import React from "react";
import { Box, Skeleton, Stack, useTheme } from "@mui/material";
import Surface from "./Surface";

export default function LoadingSkeleton({
  variant = "cards",
  rows = 6,
  columns = 4,
  cards = 6,
  sx,
}) {
  const theme = useTheme();
  const skeletonSx = {
    bgcolor: theme.palette.surface[3],
    transform: "none",
  };

  if (variant === "table") {
    return (
      <Surface sx={{ overflow: "hidden", ...sx }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(120px, 1fr))`,
            gap: 1.25,
            p: 1.25,
            bgcolor: theme.palette.surface[2],
            minWidth: columns * 140,
          }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={16} sx={skeletonSx} />
          ))}
        </Box>
        <Stack spacing={0} sx={{ minWidth: columns * 140 }}>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, minmax(120px, 1fr))`,
                gap: 1.25,
                p: 1.25,
                bgcolor: rowIndex % 2 === 1 ? theme.palette.surface[1] : "transparent",
              }}
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <Skeleton
                  key={columnIndex}
                  variant="rounded"
                  height={18}
                  width={columnIndex === 0 ? "72%" : "58%"}
                  sx={{ ...skeletonSx, mx: columnIndex === 0 ? 0 : "auto" }}
                />
              ))}
            </Box>
          ))}
        </Stack>
      </Surface>
    );
  }

  if (variant === "stats") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(8, minmax(0, 1fr))",
          },
          gap: 1.25,
          ...sx,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Surface key={index} sx={{ p: 1.5 }}>
            <Skeleton variant="rounded" height={12} width="70%" sx={{ ...skeletonSx, mb: 1 }} />
            <Skeleton variant="rounded" height={22} width="52%" sx={skeletonSx} />
          </Surface>
        ))}
      </Box>
    );
  }

  if (variant === "panel") {
    return (
      <Surface sx={{ p: { xs: 2, sm: 3 }, ...sx }}>
        <Skeleton variant="rounded" width="34%" height={24} sx={{ ...skeletonSx, mb: 1.25 }} />
        <Skeleton variant="rounded" width="62%" height={14} sx={{ ...skeletonSx, mb: 2.5 }} />
        <LoadingSkeleton variant="table" rows={rows} columns={columns} />
      </Surface>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
        gap: { xs: 2, sm: 2.5 },
        ...sx,
      }}
    >
      {Array.from({ length: cards }).map((_, index) => (
        <Surface key={index} sx={{ p: 2, minHeight: 250 }}>
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" width={48} height={48} sx={skeletonSx} />
            <Skeleton variant="rounded" width="84%" height={22} sx={skeletonSx} />
            <Skeleton variant="rounded" width="64%" height={18} sx={skeletonSx} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, pt: 1 }}>
              <Skeleton variant="rounded" height={48} sx={skeletonSx} />
              <Skeleton variant="rounded" height={48} sx={skeletonSx} />
            </Box>
            <Skeleton variant="rounded" height={1} sx={{ ...skeletonSx, my: 0.5 }} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="circular" width={18} height={18} sx={skeletonSx} />
              <Skeleton variant="rounded" width="42%" height={18} sx={skeletonSx} />
            </Stack>
          </Stack>
        </Surface>
      ))}
    </Box>
  );
}
