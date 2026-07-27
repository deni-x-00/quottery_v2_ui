import React, { useEffect, useRef, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Grow,
  IconButton,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Toolbar,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ConnectLink from "../qubic/connect/ConnectLink";
import PriceTicker from "../PriceTicker";
import TickIndicator from "../TickIndicator";
import { useConfig } from "../../contexts/ConfigContext";
import { useQubicConnect } from "../qubic/connect/QubicConnectContext";
import { useQuotteryContext } from "../../contexts/QuotteryContext";
import { useThemeContext } from "../../contexts/ThemeContext";
import { useBalanceNotifier } from "../../hooks/useBalanceNotifier";
import { PAGE_GUTTER_X, PAGE_MAX_WIDTH } from "../ui/layout";
import quotteryLogo from "../../../assets/quottery.svg";
import { formatQubicAmount } from "../qubic/util";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import NotificationCenter from "./NotificationCenter";

const primaryNav = [
  { labelKey: "nav.home", to: "/" },
  { labelKey: "nav.markets", to: "/markets" },
  { labelKey: "nav.leaderboard", to: "/leaderboard" },
];

const secondaryNav = [
  { labelKey: "nav.about", to: "/about" },
  { labelKey: "nav.governance", to: "/governance" },
  { labelKey: "nav.utilities", to: "/utilities" },
];

const headerContainerSx = {
  width: "100%",
  maxWidth: PAGE_MAX_WIDTH,
  mx: "auto",
  px: PAGE_GUTTER_X,
};

function QuotteryMark() {
  return (
    <Box
      component="img"
      src={quotteryLogo}
      alt=""
      aria-hidden="true"
      sx={{
        width: 30,
        height: 30,
        display: "block",
        objectFit: "contain",
        flexShrink: 0,
      }}
    />
  );
}

function isActiveRoute(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

const Header = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const isDesktopNav = useMediaQuery(theme.breakpoints.up("md"));
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { isConnected } = useConfig();
  const { connected: walletConnected, toggleConnectModal } = useQubicConnect();
  const { walletPublicIdentity, fetchBalance, balance } = useQuotteryContext();
  const { refreshBalanceWithNotifications } = useBalanceNotifier();
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState(null);
  const moreOpenTimerRef = useRef(null);
  const moreCloseTimerRef = useRef(null);
  const moreTriggerHoveredRef = useRef(false);
  const moreMenuHoveredRef = useRef(false);

  const scrollTrigger = useScrollTrigger({ disableHysteresis: true, threshold: 24 });
  const navItems = isConnected
    ? [...primaryNav, { labelKey: "nav.portfolio", to: "/portfolio" }]
    : primaryNav;
  const mobileItems = [...navItems, ...secondaryNav];

  useEffect(() => {
    let intervalId;
    const pollBalance = async () => {
      if (!walletPublicIdentity || typeof fetchBalance !== "function") return;
      await refreshBalanceWithNotifications();
    };
    if (walletPublicIdentity && typeof fetchBalance === "function") {
      intervalId = setInterval(pollBalance, 60000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [walletPublicIdentity, fetchBalance, refreshBalanceWithNotifications]);

  const clearMoreOpenTimer = () => {
    if (moreOpenTimerRef.current) {
      clearTimeout(moreOpenTimerRef.current);
      moreOpenTimerRef.current = null;
    }
  };

  const clearMoreCloseTimer = () => {
    if (moreCloseTimerRef.current) {
      clearTimeout(moreCloseTimerRef.current);
      moreCloseTimerRef.current = null;
    }
  };

  const handleMoreOpen = (event) => {
    clearMoreOpenTimer();
    clearMoreCloseTimer();
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    clearMoreOpenTimer();
    clearMoreCloseTimer();
    moreTriggerHoveredRef.current = false;
    moreMenuHoveredRef.current = false;
    setMoreAnchorEl(null);
  };

  const scheduleMoreOpen = (event) => {
    if (!isDesktopNav) return;
    moreTriggerHoveredRef.current = true;
    const anchor = event.currentTarget;
    clearMoreCloseTimer();
    if (moreAnchorEl) return;
    clearMoreOpenTimer();
    moreOpenTimerRef.current = setTimeout(() => {
      moreOpenTimerRef.current = null;
      if (anchor.isConnected) setMoreAnchorEl(anchor);
    }, 90);
  };

  const scheduleMoreClose = () => {
    if (!isDesktopNav) return;
    clearMoreOpenTimer();
    clearMoreCloseTimer();
    moreCloseTimerRef.current = setTimeout(() => {
      moreCloseTimerRef.current = null;
      if (!moreTriggerHoveredRef.current && !moreMenuHoveredRef.current) {
        setMoreAnchorEl(null);
      }
    }, 220);
  };

  const handleMoreTriggerLeave = () => {
    moreTriggerHoveredRef.current = false;
    scheduleMoreClose();
  };

  const handleMoreMenuEnter = () => {
    moreMenuHoveredRef.current = true;
    clearMoreCloseTimer();
  };

  const handleMoreMenuLeave = () => {
    moreMenuHoveredRef.current = false;
    scheduleMoreClose();
  };

  useEffect(() => {
    return () => {
      clearMoreOpenTimer();
      clearMoreCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (moreOpenTimerRef.current) {
      clearTimeout(moreOpenTimerRef.current);
      moreOpenTimerRef.current = null;
    }
    if (moreCloseTimerRef.current) {
      clearTimeout(moreCloseTimerRef.current);
      moreCloseTimerRef.current = null;
    }
    moreTriggerHoveredRef.current = false;
    moreMenuHoveredRef.current = false;
    setMoreAnchorEl(null);
    setMobileAnchorEl(null);
  }, [location.pathname, isDesktopNav]);

  const navButtonSx = (active = false) => ({
    minHeight: 34,
    px: 1.35,
    borderRadius: 1,
    border: `1px solid ${active ? theme.palette.primary.main : "transparent"}`,
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    bgcolor: active ? alpha(theme.palette.primary.main, 0.13) : "transparent",
    fontSize: "0.82rem",
    fontWeight: 800,
    lineHeight: 1,
    whiteSpace: "nowrap",
    "&:hover": {
      color: active ? theme.palette.primary.main : theme.palette.text.primary,
      borderColor: active ? theme.palette.primary.main : theme.palette.border.default,
      bgcolor: active ? alpha(theme.palette.primary.main, 0.18) : theme.palette.surface[1],
    },
  });

  const iconButtonSx = {
    width: 36,
    height: 36,
    border: `1px solid ${theme.palette.border.soft}`,
    color: theme.palette.text.secondary,
    bgcolor: theme.palette.surface[1],
    "&:hover": {
      color: theme.palette.text.primary,
      borderColor: theme.palette.border.default,
      bgcolor: theme.palette.surface[2],
    },
  };

  const moreMenu = (
    <Popper
      anchorEl={moreAnchorEl}
      open={Boolean(moreAnchorEl)}
      placement="bottom-end"
      transition
      modifiers={[
        {
          name: "offset",
          options: { offset: [0, 6] },
        },
      ]}
      sx={{ zIndex: theme.zIndex.modal }}
    >
      {({ TransitionProps }) => (
        <Grow
          {...TransitionProps}
          timeout={{ enter: 180, exit: 140 }}
          style={{ transformOrigin: "top right" }}
        >
          <Paper
            onMouseEnter={handleMoreMenuEnter}
            onMouseLeave={handleMoreMenuLeave}
            sx={{
              position: "relative",
              minWidth: 176,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.border.default}`,
              borderRadius: 1.5,
              boxShadow: "0 20px 44px rgba(0,0,0,0.44)",
              overflow: "visible",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -8,
                left: 0,
                right: 0,
                height: 8,
              },
            }}
          >
            <ClickAwayListener onClickAway={handleMoreClose}>
              <MenuList
                autoFocusItem={false}
                sx={{ py: 0.75, overflow: "hidden", borderRadius: 1.5 }}
              >
                {secondaryNav.map((item) => (
                  <MenuItem
                    key={item.to}
                    component={Link}
                    to={item.to}
                    onClick={handleMoreClose}
                    selected={isActiveRoute(location.pathname, item.to)}
                    sx={{
                      minHeight: 40,
                      fontWeight: 800,
                      color: "text.secondary",
                      "&.Mui-selected": {
                        color: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                      "&:hover": {
                        color: "text.primary",
                        bgcolor: theme.palette.surface[2],
                      },
                    }}
                  >
                    {t(item.labelKey)}
                  </MenuItem>
                ))}
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );

  const mobileMenu = (
    <Menu
      anchorEl={mobileAnchorEl}
      open={Boolean(mobileAnchorEl)}
      onClose={() => setMobileAnchorEl(null)}
      disableScrollLock
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        sx: {
          mt: 1,
          width: 220,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.border.default}`,
          borderRadius: 1.5,
        },
      }}
    >
      <MenuItem
        onClick={() => {
          setMobileAnchorEl(null);
          toggleConnectModal();
        }}
        sx={{
          minHeight: 46,
          fontWeight: 900,
          gap: 1.25,
          color: walletConnected ? "primary.main" : "text.primary",
        }}
      >
        <AccountBalanceWalletIcon fontSize="small" />
        {walletConnected ? `${formatQubicAmount(balance ?? 0)} GARTH` : t("wallet.connect")}
      </MenuItem>
      <Divider sx={{ borderColor: theme.palette.border.soft }} />
      {mobileItems.map((item) => (
        <MenuItem
          key={item.to}
          component={Link}
          to={item.to}
          selected={isActiveRoute(location.pathname, item.to)}
          onClick={() => setMobileAnchorEl(null)}
          sx={{ minHeight: 42, fontWeight: 800 }}
        >
          {t(item.labelKey)}
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: theme.zIndex.appBar,
        bgcolor: alpha(theme.palette.background.default, scrollTrigger ? 0.92 : 0.86),
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrollTrigger ? theme.palette.border.default : theme.palette.border.soft}`,
        boxShadow: scrollTrigger ? "0 12px 36px rgba(0,0,0,0.22)" : "none",
        transition: "background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
      }}
    >
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.border.soft}`,
          bgcolor: alpha(theme.palette.background.default, 0.62),
        }}
      >
        <Box sx={headerContainerSx}>
          <Box
            sx={{
              minHeight: { xs: 30, md: 34 },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 1, md: 2 },
              overflow: "hidden",
            }}
          >
            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
              <PriceTicker showIcons={false} topBar />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", minWidth: 0, flexShrink: 0 }}>
              <TickIndicator topBar />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={headerContainerSx}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 56, md: 60 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr auto", md: "auto 1fr auto" },
            alignItems: "center",
            gap: { xs: 1, md: 2 },
          }}
        >
          <Box
            component={Link}
            to="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              color: "text.primary",
              textDecoration: "none",
            }}
          >
            <QuotteryMark />
            <Typography
              component="span"
              sx={{
                display: { xs: "none", sm: "inline" },
                fontSize: "1rem",
                fontWeight: 800,
                letterSpacing: 0,
                lineHeight: 1,
              }}
            >
              Quottery
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label={t("nav.main")}
            sx={{
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={Link}
                to={item.to}
                size="small"
                sx={navButtonSx(isActiveRoute(location.pathname, item.to))}
              >
                {t(item.labelKey)}
              </Button>
            ))}
            <Box
              onMouseEnter={scheduleMoreOpen}
              onMouseLeave={handleMoreTriggerLeave}
              sx={{ position: "relative", display: "inline-flex", py: 0.75, my: -0.75 }}
            >
              <Button
                size="small"
                onClick={(event) => (moreAnchorEl ? handleMoreClose() : handleMoreOpen(event))}
                onDoubleClick={handleMoreClose}
                aria-haspopup="menu"
                aria-expanded={Boolean(moreAnchorEl) ? "true" : undefined}
                endIcon={
                  <MoreHorizIcon
                    sx={{
                      fontSize: 18,
                    }}
                  />
                }
                sx={navButtonSx(secondaryNav.some((item) => isActiveRoute(location.pathname, item.to)) || Boolean(moreAnchorEl))}
              >
                {t("nav.more")}
              </Button>
            </Box>
            {moreMenu}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: { xs: 0.75, md: 1 },
              minWidth: 0,
            }}
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <ConnectLink />
            </Box>
            <NotificationCenter iconButtonSx={iconButtonSx} />
            <LanguageSelector />
            <Tooltip title={isDarkMode ? t("theme.switchToLight") : t("theme.switchToDark")} arrow>
              <IconButton
                aria-label={isDarkMode ? t("theme.switchToLight") : t("theme.switchToDark")}
                onClick={toggleTheme}
                size="small"
                sx={{ ...iconButtonSx, display: { xs: "none", md: "inline-flex" } }}
              >
                {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <IconButton
              aria-label={t("nav.open")}
              onClick={(event) => setMobileAnchorEl(event.currentTarget)}
              size="small"
              sx={{ ...iconButtonSx, display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            {mobileMenu}
          </Box>
        </Toolbar>
      </Box>
    </AppBar>
  );
};

export default Header;
