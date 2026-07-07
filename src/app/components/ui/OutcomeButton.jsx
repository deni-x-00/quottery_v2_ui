import React from "react";
import { Box, ButtonBase, Typography, alpha, useTheme } from "@mui/material";

export default function OutcomeButton({
  outcome,
  label,
  value,
  disabled = false,
  onClick,
  sx,
}) {
  const theme = useTheme();
  const isYes = outcome === "yes" || Number(outcome) === 0;
  const palette = isYes
    ? {
        main: theme.palette.market.yes,
        text: theme.palette.market.yesText,
        bg: theme.palette.market.yesBg,
        border: theme.palette.market.yesBorder,
      }
    : {
        main: theme.palette.market.no,
        text: theme.palette.market.noText,
        bg: theme.palette.market.noBg,
        border: theme.palette.market.noBorder,
      };

  return (
    <ButtonBase
      disabled={disabled}
      onClick={onClick}
      aria-label={`${label}: ${value || "-"}`}
      sx={{
        width: "100%",
        flex: "1 1 0",
        minWidth: 0,
        minHeight: 48,
        px: 1.5,
        py: 1.15,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        borderRadius: 1.5,
        border: `1px solid ${palette.border}`,
        bgcolor: palette.bg,
        color: palette.text,
        opacity: disabled ? 0.55 : 1,
        transition: "background-color 150ms ease, border-color 150ms ease, transform 150ms ease",
        "&:hover": disabled
          ? undefined
          : {
              bgcolor: alpha(palette.main, 0.22),
              borderColor: alpha(palette.main, 0.55),
              transform: "translateY(-1px)",
            },
        "&.Mui-focusVisible": {
          boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${palette.main}`,
        },
        ...sx,
      }}
    >
      <Typography
        component="span"
        sx={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: { xs: "0.82rem", sm: "0.88rem" },
          fontWeight: 900,
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Box
        component="span"
        className="percent"
        sx={{
          flexShrink: 0,
          fontSize: { xs: "0.86rem", sm: "0.92rem" },
          fontWeight: 900,
          lineHeight: 1,
          color: palette.text,
        }}
      >
        {value}
      </Box>
    </ButtonBase>
  );
}
