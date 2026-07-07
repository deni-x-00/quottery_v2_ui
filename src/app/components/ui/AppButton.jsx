import React from "react";
import { Button, alpha, useTheme } from "@mui/material";

const variantMap = {
  primary: "primary",
  secondary: "outlined",
  ghost: "text",
  yes: "outlined",
  no: "outlined",
  destructive: "outlined",
};

const sizeMap = {
  xs: { minHeight: 32, px: 1.5, fontSize: "0.75rem" },
  sm: { minHeight: 40, px: 2, fontSize: "0.8125rem" },
  md: { minHeight: 48, px: 2.5, fontSize: "0.8125rem" },
  lg: { minHeight: 56, px: 3.5, fontSize: "0.875rem" },
};

function semanticStyles(theme, variant) {
  const semantic = {
    yes: {
      color: theme.palette.market.yesText,
      borderColor: theme.palette.market.yesBorder,
      backgroundColor: theme.palette.market.yesBg,
      "&:hover": {
        borderColor: theme.palette.market.yes,
        backgroundColor: alpha(theme.palette.market.yes, 0.22),
      },
      "&.Mui-focusVisible": {
        boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.market.yes}`,
      },
    },
    no: {
      color: theme.palette.market.noText,
      borderColor: theme.palette.market.noBorder,
      backgroundColor: theme.palette.market.noBg,
      "&:hover": {
        borderColor: theme.palette.market.no,
        backgroundColor: alpha(theme.palette.market.no, 0.22),
      },
      "&.Mui-focusVisible": {
        boxShadow: `0 0 0 2px ${theme.palette.background.default}, 0 0 0 4px ${theme.palette.market.no}`,
      },
    },
    destructive: {
      color: theme.palette.market.noText,
      borderColor: theme.palette.market.noBorder,
      backgroundColor: alpha(theme.palette.market.no, 0.08),
      "&:hover": {
        borderColor: theme.palette.market.no,
        backgroundColor: alpha(theme.palette.market.no, 0.16),
      },
    },
  };

  return semantic[variant] || {};
}

export default function AppButton({
  variant = "primary",
  size = "md",
  sx,
  children,
  ...props
}) {
  const theme = useTheme();
  const isSemantic = ["yes", "no", "destructive"].includes(variant);

  return (
    <Button
      variant={variantMap[variant] || variant}
      color={isSemantic ? "inherit" : variantMap[variant] === "primary" ? "primary" : "inherit"}
      sx={{
        ...sizeMap[size],
        borderRadius: 1,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...semanticStyles(theme, variant),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
