import { alpha, createTheme } from "@mui/material/styles";

export const brandTokens = {
  bg0: "#05070B",
  bg1: "#070A0F",
  bg2: "#0D1118",
  bg3: "#121821",
  bg4: "#171E28",
  surface1: "rgba(255, 255, 255, 0.045)",
  surface2: "rgba(255, 255, 255, 0.065)",
  surface3: "rgba(255, 255, 255, 0.09)",
  surface4: "rgba(255, 255, 255, 0.12)",
  borderSoft: "rgba(255, 255, 255, 0.08)",
  borderDefault: "rgba(255, 255, 255, 0.14)",
  borderStrong: "rgba(255, 255, 255, 0.24)",
  textPrimary: "#F5F8FB",
  textSecondary: "#AAB6C5",
  textMuted: "#6F7B8C",
  textDisabled: "#46505E",
  cyan: "#45E8F6",
  cyanStrong: "#20DFF2",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  yes: "#63E68A",
  yesText: "#8FF5A8",
  no: "#FF8A94",
  noText: "#FFA3AA",
  warning: "#FBBF24",
  archive: "#8B95A5",
};

const lightTokens = {
  bg0: "#F8FAFC",
  bg1: "#FFFFFF",
  bg2: "#EEF2F6",
  surface1: "#FFFFFF",
  surface2: "#F1F5F9",
  surface3: "#E2E8F0",
  surface4: "#CBD5E1",
  borderSoft: "rgba(15, 23, 42, 0.16)",
  borderDefault: "rgba(15, 23, 42, 0.24)",
  borderStrong: "rgba(15, 23, 42, 0.38)",
  textPrimary: "#07111C",
  textSecondary: "#253348",
  textMuted: "#526071",
  textDisabled: "#7A8699",
  cyan: "#006B78",
  cyanStrong: "#005562",
  violet: "#6D28D9",
  yes: "#067647",
  yesText: "#067647",
  no: "#B42335",
  noText: "#B42335",
  warning: "#9A5700",
  archive: "#5D6675",
};

const baseTypography = {
  fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: "clamp(2.4rem, 5vw, 4.75rem)",
    lineHeight: 1,
    letterSpacing: "-0.04em",
  },
  h2: {
    fontWeight: 700,
    fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
  },
  h3: {
    fontWeight: 700,
    fontSize: "2rem",
    lineHeight: 1.16,
    letterSpacing: "-0.025em",
  },
  h4: {
    fontWeight: 700,
    fontSize: "1.5rem",
    lineHeight: 1.2,
  },
  h5: {
    fontWeight: 700,
    fontSize: "1.125rem",
    lineHeight: 1.25,
  },
  h6: {
    fontWeight: 700,
    fontSize: "1rem",
    lineHeight: 1.25,
  },
  body1: {
    fontSize: "1rem",
    lineHeight: 1.625,
  },
  body2: {
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 700,
    textTransform: "none",
    letterSpacing: "0.01em",
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: 1.35,
  },
};

const createQuotteryTheme = (mode) => {
  const isDark = mode === "dark";
  const cssTokens = isDark ? brandTokens : lightTokens;
  const palette = {
    mode,
    primary: {
      main: isDark ? brandTokens.cyan : lightTokens.cyan,
      dark: isDark ? brandTokens.cyanStrong : lightTokens.cyanStrong,
      contrastText: isDark ? brandTokens.bg0 : "#FFFFFF",
    },
    secondary: {
      main: isDark ? brandTokens.violet : lightTokens.violet,
      contrastText: isDark ? brandTokens.textPrimary : "#FFFFFF",
    },
    tertiary: {
      main: isDark ? brandTokens.textSecondary : lightTokens.textSecondary,
    },
    error: {
      main: isDark ? brandTokens.no : lightTokens.no,
      light: isDark ? brandTokens.noText : "#D92D47",
      contrastText: isDark ? brandTokens.bg0 : "#FFFFFF",
    },
    warning: {
      main: isDark ? brandTokens.warning : lightTokens.warning,
      contrastText: isDark ? brandTokens.bg0 : "#FFFFFF",
    },
    success: {
      main: isDark ? brandTokens.yes : lightTokens.yes,
      light: isDark ? brandTokens.yesText : "#12B76A",
      contrastText: isDark ? brandTokens.bg0 : "#FFFFFF",
    },
    background: {
      default: isDark ? brandTokens.bg0 : lightTokens.bg0,
      paper: isDark ? brandTokens.bg3 : lightTokens.bg1,
      card: isDark ? brandTokens.bg4 : lightTokens.bg1,
    },
    text: {
      primary: isDark ? brandTokens.textPrimary : lightTokens.textPrimary,
      secondary: isDark ? brandTokens.textSecondary : lightTokens.textSecondary,
      disabled: isDark ? brandTokens.textDisabled : lightTokens.textDisabled,
    },
    divider: isDark ? brandTokens.borderSoft : lightTokens.borderSoft,
    market: {
      yes: isDark ? brandTokens.yes : lightTokens.yes,
      yesText: isDark ? brandTokens.yesText : lightTokens.yesText,
      yesBg: alpha(isDark ? brandTokens.yes : lightTokens.yes, isDark ? 0.14 : 0.13),
      yesBorder: alpha(isDark ? brandTokens.yes : lightTokens.yes, isDark ? 0.32 : 0.34),
      no: isDark ? brandTokens.no : lightTokens.no,
      noText: isDark ? brandTokens.noText : lightTokens.noText,
      noBg: alpha(isDark ? brandTokens.no : lightTokens.no, isDark ? 0.14 : 0.12),
      noBorder: alpha(isDark ? brandTokens.no : lightTokens.no, isDark ? 0.32 : 0.34),
    },
    status: {
      open: isDark ? brandTokens.cyan : lightTokens.cyan,
      closed: isDark ? brandTokens.warning : lightTokens.warning,
      resolved: isDark ? brandTokens.yes : lightTokens.yes,
      cancelled: isDark ? brandTokens.no : lightTokens.no,
      archive: isDark ? brandTokens.archive : lightTokens.archive,
    },
    surface: {
      1: isDark ? brandTokens.surface1 : lightTokens.surface1,
      2: isDark ? brandTokens.surface2 : lightTokens.surface2,
      3: isDark ? brandTokens.surface3 : lightTokens.surface3,
      4: isDark ? brandTokens.surface4 : lightTokens.surface4,
    },
    border: {
      soft: isDark ? brandTokens.borderSoft : lightTokens.borderSoft,
      default: isDark ? brandTokens.borderDefault : lightTokens.borderDefault,
      strong: isDark ? brandTokens.borderStrong : lightTokens.borderStrong,
    },
  };
  const themeShadows = isDark
    ? [
        "none",
        "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "0 2px 8px rgba(0,0,0,0.35)",
        "0 4px 16px rgba(0,0,0,0.3)",
        "0 8px 24px rgba(0,0,0,0.32)",
        "0 16px 40px rgba(0,0,0,0.36)",
        ...Array(19).fill("0 24px 48px rgba(0,0,0,0.4)"),
      ]
    : [
        "none",
        "0 1px 2px rgba(15, 23, 42, 0.08)",
        "0 2px 8px rgba(15, 23, 42, 0.08)",
        "0 4px 16px rgba(15, 23, 42, 0.1)",
        "0 8px 24px rgba(15, 23, 42, 0.12)",
        "0 16px 40px rgba(15, 23, 42, 0.14)",
        ...Array(19).fill("0 24px 48px rgba(15, 23, 42, 0.16)"),
      ];
  const cssVariables = {
    "--bg-0": cssTokens.bg0,
    "--bg-1": isDark ? brandTokens.bg1 : lightTokens.bg1,
    "--bg-2": isDark ? brandTokens.bg2 : lightTokens.bg2,
    "--bg-3": isDark ? brandTokens.bg3 : lightTokens.bg1,
    "--bg-4": isDark ? brandTokens.bg4 : lightTokens.bg1,
    "--surface-1": cssTokens.surface1,
    "--surface-2": cssTokens.surface2,
    "--surface-3": cssTokens.surface3,
    "--surface-4": cssTokens.surface4,
    "--border-soft": cssTokens.borderSoft,
    "--border-default": cssTokens.borderDefault,
    "--border-strong": cssTokens.borderStrong,
    "--text-primary": cssTokens.textPrimary,
    "--text-secondary": cssTokens.textSecondary,
    "--text-muted": cssTokens.textMuted,
    "--text-disabled": cssTokens.textDisabled,
    "--brand-cyan": cssTokens.cyan,
    "--brand-cyan-strong": cssTokens.cyanStrong,
    "--brand-cyan-soft": alpha(cssTokens.cyan, isDark ? 0.16 : 0.13),
    "--brand-cyan-border": alpha(cssTokens.cyan, isDark ? 0.25 : 0.34),
    "--brand-violet": cssTokens.violet,
    "--market-yes": cssTokens.yes,
    "--market-yes-text": cssTokens.yesText,
    "--market-yes-bg": alpha(cssTokens.yes, isDark ? 0.14 : 0.13),
    "--market-yes-border": alpha(cssTokens.yes, isDark ? 0.32 : 0.34),
    "--market-no": cssTokens.no,
    "--market-no-text": cssTokens.noText,
    "--market-no-bg": alpha(cssTokens.no, isDark ? 0.14 : 0.12),
    "--market-no-border": alpha(cssTokens.no, isDark ? 0.32 : 0.34),
    "--status-open": cssTokens.cyan,
    "--status-closed": cssTokens.warning,
    "--status-resolved": cssTokens.yes,
    "--status-cancelled": cssTokens.no,
    "--status-archive": cssTokens.archive,
    "--shadow-card": isDark
      ? "0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)"
      : "0 1px 2px rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.08)",
    "--shadow-modal": isDark
      ? "0 24px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4)"
      : "0 24px 48px rgba(15, 23, 42, 0.14), 0 8px 16px rgba(15, 23, 42, 0.08)",
    "--focus-ring": `0 0 0 2px ${cssTokens.bg0}, 0 0 0 4px ${cssTokens.cyan}`,
  };

  return createTheme({
    palette,
    typography: baseTypography,
    shape: {
      borderRadius: 8,
    },
    shadows: themeShadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": cssVariables,
          html: {
            backgroundColor: palette.background.default,
            colorScheme: isDark ? "dark" : "light",
          },
          body: {
            ...(isDark ? {} : { background: palette.background.default }),
            backgroundColor: palette.background.default,
            color: palette.text.primary,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 40,
            fontWeight: 700,
            transition:
              "color 150ms cubic-bezier(0,0,0.2,1), background-color 150ms cubic-bezier(0,0,0.2,1), border-color 150ms cubic-bezier(0,0,0.2,1), transform 80ms cubic-bezier(0.4,0,0.2,1)",
            "&:active": {
              transform: "scale(0.98)",
            },
            "&.Mui-focusVisible": {
              boxShadow: `0 0 0 2px ${palette.background.default}, 0 0 0 4px ${palette.primary.main}`,
            },
          },
          containedPrimary: {
            color: palette.primary.contrastText,
            backgroundColor: palette.primary.main,
            "&:hover": {
              backgroundColor: palette.primary.dark,
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderColor: palette.border.default,
            color: palette.text.primary,
            backgroundColor: palette.surface[1],
            "&:hover": {
              borderColor: palette.border.strong,
              backgroundColor: palette.surface[2],
            },
          },
          text: {
            color: palette.text.secondary,
            "&:hover": {
              color: palette.text.primary,
              backgroundColor: palette.surface[1],
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderColor: palette.border.soft,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: palette.surface[1],
            border: `1px solid ${palette.border.soft}`,
            borderRadius: 12,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)"
              : "0 1px 2px rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.08)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: palette.surface[2],
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.border.soft,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.border.default,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: 1,
            },
          },
          input: {
            fontVariantNumeric: "tabular-nums",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: palette.border.soft,
          },
          head: {
            color: palette.text.secondary,
            fontWeight: 800,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 2,
            backgroundColor: palette.primary.main,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 800,
            color: palette.text.secondary,
            "&.Mui-selected": {
              color: palette.primary.main,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: brandTokens.bg3,
            border: `1px solid ${brandTokens.borderDefault}`,
            color: brandTokens.textPrimary,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          },
        },
      },
    },
  });
};

export const darkTheme = createQuotteryTheme("dark");
export const lightTheme = createQuotteryTheme("light");
