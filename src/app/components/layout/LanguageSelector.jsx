import React, { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../i18n/translations";

export default function LanguageSelector() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const activeCode = String(i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const activeLanguage = supportedLanguages.find((language) => language.code === activeCode) || supportedLanguages[0];

  const selectLanguage = async (language) => {
    setAnchorEl(null);
    await i18n.changeLanguage(language);
  };

  return (
    <>
      <Tooltip title={t("language.select")} arrow>
        <Button
          size="small"
          aria-label={t("language.select")}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl) ? "true" : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          startIcon={<TranslateIcon sx={{ fontSize: 18 }} />}
          sx={{
            minWidth: { xs: 38, md: 72 },
            width: { xs: 38, md: "auto" },
            height: 36,
            px: { xs: 0, md: 1.1 },
            borderRadius: 1,
            border: `1px solid ${theme.palette.border.soft}`,
            color: theme.palette.text.secondary,
            bgcolor: theme.palette.surface[1],
            fontWeight: 850,
            fontSize: "0.76rem",
            "& .MuiButton-startIcon": { m: { xs: 0, md: "0 5px 0 0" } },
            "&:hover": {
              color: theme.palette.text.primary,
              borderColor: theme.palette.border.default,
              bgcolor: theme.palette.surface[2],
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
            {activeLanguage.shortLabel}
          </Box>
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 0.75,
            minWidth: 190,
            borderRadius: 1.5,
            border: `1px solid ${theme.palette.border.default}`,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        {supportedLanguages.map((language) => {
          const selected = language.code === activeCode;
          return (
            <MenuItem
              key={language.code}
              selected={selected}
              onClick={() => selectLanguage(language.code)}
              sx={{
                minHeight: 40,
                display: "grid",
                gridTemplateColumns: "28px 1fr auto",
                gap: 1,
                fontWeight: selected ? 850 : 700,
                "&.Mui-selected": { bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main" },
              }}
            >
              <span>{language.shortLabel}</span>
              <span>{language.nativeLabel}</span>
              {selected ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : null}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
