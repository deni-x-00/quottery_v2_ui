import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Container, useTheme,
  useScrollTrigger, Button, Typography, Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ConnectLink from '../qubic/connect/ConnectLink';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useConfig } from '../../contexts/ConfigContext';
import logoLight from '../../assets/logo/logo-text-on-light.svg';
import logoDark from '../../assets/logo/logo-text-on-dark.svg';
import connectIcon from '../../assets/connect.svg';
import connectedIcon from '../../assets/connected.svg';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuotteryContext } from '../../contexts/QuotteryContext';
import { useBalanceNotifier } from '../../hooks/useBalanceNotifier';
import ServerConnectModal from '../qubic/connect/ServerConfigModal';
import TickIndicator from '../TickIndicator';

const Header = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const { isConnected } = useConfig();
  const { walletPublicIdentity, fetchBalance } = useQuotteryContext();
  const { refreshBalanceWithNotifications } = useBalanceNotifier();
  const [refreshing, setRefreshing] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);

  useEffect(() => {
    let intervalId;
    const pollBalance = async () => {
      if (!walletPublicIdentity || typeof fetchBalance !== 'function') return;
      await refreshBalanceWithNotifications();
    };
    if (walletPublicIdentity && typeof fetchBalance === 'function') {
      intervalId = setInterval(pollBalance, 15000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [walletPublicIdentity, fetchBalance, refreshBalanceWithNotifications]);

  const handleRefreshBalance = async () => {
    if (refreshing) return;
    try { setRefreshing(true); await refreshBalanceWithNotifications(); }
    finally { setRefreshing(false); }
  };

  const scrollTrigger = useScrollTrigger({ disableHysteresis: true, threshold: 100 });

  return (
      <>
        <AppBar sx={{
          background: theme.palette.background.paper,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          boxShadow: scrollTrigger ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
          position: 'fixed', top: 0, left: 0, width: '100%', zIndex: theme.zIndex.appBar,
        }}>
          <Container maxWidth='xxl'>
            <Toolbar disableGutters sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3, md: 4 },
            }}>
              <Box display='flex' alignItems='center' gap={2}>
                <IconButton component={Link} to='/' edge='start' color='inherit' disableRipple
                            sx={{ p: 0, '&:hover': { backgroundColor: 'transparent' } }}>
                  <Box component='img' src={isDarkMode ? logoDark : logoLight} alt='logo'
                       sx={{ height: { xs: 32, sm: 36, md: 40 } }} />
                </IconButton>
                <TickIndicator />
              </Box>

              <Box display='flex' alignItems='center' gap={2}>
                {isConnected && (
                    <>
                      <Button component={Link} to='/orders' color='inherit' size='small'>
                        <Typography variant="h6" color="text.secondary">Orders & Positions</Typography>
                      </Button>
                      <Button component={Link} to='/governance' color='inherit' size='small'>
                        <Typography variant="h6" color="text.secondary">Governance</Typography>
                      </Button>
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
                <Tooltip title={isConnected ? 'Server connected' : 'Connect to server'}>
                  <IconButton onClick={() => setServerModalOpen(true)} color='inherit' size='small'>
                    <Box component='img' src={isConnected ? connectedIcon : connectIcon}
                         alt={isConnected ? 'Connected' : 'Connect'}
                         sx={{ width: 24, height: 24, filter: isDarkMode ? 'invert(0)' : 'invert(1)' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        <ServerConnectModal open={serverModalOpen} onClose={() => setServerModalOpen(false)} />
      </>
  );
};

export default Header;
