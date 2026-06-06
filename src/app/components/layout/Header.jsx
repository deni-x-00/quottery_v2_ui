import React, { useEffect, useRef, useState } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Container, useTheme,
  useScrollTrigger, Button, Typography, Menu, MenuItem, useMediaQuery,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ConnectLink from '../qubic/connect/ConnectLink';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useConfig } from '../../contexts/ConfigContext';
import logoLight from '../../../assets/logo/logo-text-on-light.svg';
import logoDark from '../../../assets/logo/logo-text-on-dark.svg';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useQuotteryContext } from '../../contexts/QuotteryContext';
import { useBalanceNotifier } from '../../hooks/useBalanceNotifier';
import TickIndicator from '../TickIndicator';

const Header = () => {
  const theme = useTheme();
  const isDesktopNav = useMediaQuery(theme.breakpoints.up('md'));
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { isConnected } = useConfig();
  const { walletPublicIdentity, fetchBalance } = useQuotteryContext();
  const { refreshBalanceWithNotifications } = useBalanceNotifier();
  const [refreshing, setRefreshing] = useState(false);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const moreOpenTimerRef = useRef(null);
  const moreCloseTimerRef = useRef(null);

  useEffect(() => {
    let intervalId;
    const pollBalance = async () => {
      if (!walletPublicIdentity || typeof fetchBalance !== 'function') return;
      await refreshBalanceWithNotifications();
    };
    if (walletPublicIdentity && typeof fetchBalance === 'function') {
      intervalId = setInterval(pollBalance, 60000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [walletPublicIdentity, fetchBalance, refreshBalanceWithNotifications]);

  const handleRefreshBalance = async () => {
    if (refreshing) return;
    try { setRefreshing(true); await refreshBalanceWithNotifications(); }
    finally { setRefreshing(false); }
  };
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
    setMoreAnchorEl(null);
  };
  const scheduleMoreOpen = (event) => {
    if (!isDesktopNav) return;
    const anchor = event.currentTarget;
    clearMoreCloseTimer();
    clearMoreOpenTimer();
    moreOpenTimerRef.current = setTimeout(() => setMoreAnchorEl(anchor), 120);
  };
  const scheduleMoreClose = () => {
    if (!isDesktopNav) return;
    clearMoreOpenTimer();
    clearMoreCloseTimer();
    moreCloseTimerRef.current = setTimeout(() => setMoreAnchorEl(null), 400);
  };
  const handleMoreClick = (event) => {
    if (moreAnchorEl) handleMoreClose();
    else handleMoreOpen(event);
  };

  useEffect(() => () => {
    clearMoreOpenTimer();
    clearMoreCloseTimer();
  }, []);

  const scrollTrigger = useScrollTrigger({ disableHysteresis: true, threshold: 100 });
  const navButtonSx = { flexShrink: 0, minWidth: 'max-content', px: { xs: 1, sm: 1.25 } };
  const navTextSx = { fontSize: { xs: '0.78rem', sm: '0.9rem', md: '1rem' }, fontWeight: 600, whiteSpace: 'nowrap' };
  const moreButton = (
      <Button
          color='inherit'
          size='small'
          onClick={handleMoreClick}
          onMouseEnter={isDesktopNav ? scheduleMoreOpen : undefined}
          onMouseLeave={isDesktopNav ? scheduleMoreClose : undefined}
          onFocus={isDesktopNav ? handleMoreOpen : undefined}
          sx={navButtonSx}
      >
        <Typography color="text.secondary" sx={navTextSx}>More</Typography>
      </Button>
  );
  const moreMenu = (
      <Menu
          anchorEl={moreAnchorEl}
          open={Boolean(moreAnchorEl)}
          onClose={handleMoreClose}
          disableScrollLock
          keepMounted
          transitionDuration={180}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{
            onMouseEnter: isDesktopNav ? clearMoreCloseTimer : undefined,
            onMouseLeave: isDesktopNav ? scheduleMoreClose : undefined,
          }}
          PaperProps={{
            onMouseEnter: isDesktopNav ? clearMoreCloseTimer : undefined,
            onMouseLeave: isDesktopNav ? scheduleMoreClose : undefined,
          }}
      >
        <MenuItem component={Link} to='/about' onClick={handleMoreClose}>About</MenuItem>
        <MenuItem component={Link} to='/governance' onClick={handleMoreClose}>Governance</MenuItem>
        <MenuItem component={Link} to='/misc' onClick={handleMoreClose}>Utilities</MenuItem>
      </Menu>
  );

  return (
      <>
        <AppBar sx={{
          background: theme.palette.background.paper,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          boxShadow: scrollTrigger ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
          position: 'sticky', top: 0, left: 0, width: '100%', zIndex: theme.zIndex.appBar,
        }}>
          <Container maxWidth='xxl' sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
            <Toolbar disableGutters sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'stretch',
              gap: { xs: 0.75, md: 2 },
              minHeight: { xs: isConnected ? 104 : 60, md: 72 },
              py: { xs: 0.75, md: 0 },
              px: { xs: 0, md: 2, lg: 4 },
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'space-between', md: 'flex-start' },
                gap: { xs: 1, sm: 2 },
                minWidth: 0,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, minWidth: 0 }}>
                <IconButton component={Link} to='/' edge='start' color='inherit' disableRipple
                            sx={{ p: 0, flexShrink: 0, '&:hover': { backgroundColor: 'transparent' } }}>
                  <Box component='img' src={isDarkMode ? logoDark : logoLight} alt='logo'
                       sx={{ height: { xs: 28, sm: 36, md: 40 }, maxWidth: { xs: 150, sm: 220 }, display: 'block' }} />
                </IconButton>
                <TickIndicator />
                </Box>
                <Box sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  gap: 0.5,
                  flexShrink: 0,
                }}>
                  {isConnected && (
                      <>
                        <IconButton onClick={handleRefreshBalance} color='inherit' size='small' disabled={refreshing}>
                          <RefreshIcon fontSize='small'
                                       sx={refreshing ? {
                                         animation: 'spin 0.8s linear infinite',
                                         '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                                       } : undefined} />
                        </IconButton>
                        <ConnectLink />
                      </>
                  )}
                  <IconButton
                      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                      color='inherit'
                      onClick={toggleTheme}
                      size='small'
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        color: theme.palette.text.secondary,
                        bgcolor: theme.palette.background.default,
                        transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          color: theme.palette.text.primary,
                        },
                      }}
                  >
                    {isDarkMode ? <LightModeIcon fontSize='small' /> : <DarkModeIcon fontSize='small' />}
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                gap: { xs: 0.5, sm: 1, md: 2 },
                minWidth: 0,
                overflowX: { xs: 'auto', md: 'visible' },
                overflowY: 'hidden',
                pb: { xs: 0.25, md: 0 },
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}>
                <Button component={Link} to='/events' color='inherit' size='small' sx={navButtonSx}>
                  <Typography color="text.secondary" sx={navTextSx}>Markets</Typography>
                </Button>
                <Button component={Link} to='/leaderboard' color='inherit' size='small' sx={navButtonSx}>
                  <Typography color="text.secondary" sx={navTextSx}>Leaderboard</Typography>
                </Button>
                {isConnected && (
                    <>
                      <Button component={Link} to='/profile' color='inherit' size='small' sx={navButtonSx}>
                        <Typography color="text.secondary" sx={navTextSx}>Profile</Typography>
                      </Button>
                      {moreButton}
                      {moreMenu}
                      <IconButton onClick={handleRefreshBalance} color='inherit' size='small' disabled={refreshing} sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
                        <RefreshIcon fontSize='small'
                                     sx={refreshing ? {
                                       animation: 'spin 0.8s linear infinite',
                                       '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                                     } : undefined} />
                      </IconButton>
                      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <ConnectLink />
                      </Box>
                    </>
                )}
                {!isConnected && (
                    <>
                      {moreButton}
                      {moreMenu}
                    </>
                )}
                <IconButton
                    aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                    color='inherit'
                    onClick={toggleTheme}
                    size='small'
                    sx={{
                      display: { xs: 'none', md: 'inline-flex' },
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.default,
                      transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.action.hover,
                        color: theme.palette.text.primary,
                      },
                    }}
                >
                  {isDarkMode ? <LightModeIcon fontSize='small' /> : <DarkModeIcon fontSize='small' />}
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </>
  );
};

export default Header;
