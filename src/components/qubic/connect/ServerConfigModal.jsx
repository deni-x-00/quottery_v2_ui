import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField,
  Button, IconButton, useTheme, useMediaQuery, Stack, FormControlLabel, Checkbox, Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useConfig } from '../../../contexts/ConfigContext';

const ServerConnectModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { bobUrl, isConnected, devMode, connectToServer, disconnectFromServer, toggleDevMode } = useConfig();

  const [ipInput, setIpInput] = useState('');
  const [portInput, setPortInput] = useState('40420');
  const [devModeInput, setDevModeInput] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setDevModeInput(devMode);
      if (!isConnected) { setIpInput(''); setPortInput('40420'); }
    }
  }, [open, isConnected, devMode]);

  const handleConnect = async () => {
    if (!ipInput.trim()) { setError('Please enter the server IP or hostname.'); return; }
    if (!portInput.trim()) { setError('Please enter the port.'); return; }

    const url = `http://${ipInput.trim()}:${portInput.trim()}`;
    setTesting(true);
    setError('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/status`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (!data || !data.currentFetchingTick) {
        setError('Server responded but does not look like a Bob instance.');
        setTesting(false);
        return;
      }
      connectToServer(url, devModeInput);
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Connection timed out.' : `Cannot reach server: ${e.message}`);
    } finally { setTesting(false); }
  };

  const handleDisconnect = () => {
    disconnectFromServer();
    onClose();
    window.location.href = '/';
  };

  return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="xs"
              BackdropProps={{ sx: { backdropFilter: 'blur(8px)' } }}
              PaperProps={{ sx: { p: isMobile ? 0 : 1, py: isMobile ? 1 : 0, backgroundColor: theme.palette.background.paper }, elevation: 2 }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '0.4rem',
          backgroundColor: isConnected ? theme.palette.success.main : theme.palette.primary.main }} />
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {isConnected ? <LinkIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                : <LinkOffIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Bob Server</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pb: 3 }}>
          {isConnected ? (
              <>
                <Box sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.success.main}`,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.05)' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: '1.2rem' }} />
                    <Typography variant="body2" color="text.secondary">Connected to</Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                    {bobUrl || '—'}
                  </Typography>
                </Box>
                <FormControlLabel
                    control={<Switch checked={devMode} onChange={toggleDevMode} size="small" />}
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Dev Mode {devMode ? '(on)' : '(off)'}
                      </Typography>
                    }
                />
                <Stack direction="row" spacing={2} mt={1}>
                  <Button variant="outlined" color="inherit" fullWidth onClick={onClose}>Cancel</Button>
                  <Button variant="outlined" color="error" fullWidth startIcon={<LinkOffIcon />} onClick={handleDisconnect}>Disconnect</Button>
                </Stack>
              </>
          ) : (
              <>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Enter the Bob server address to connect.
                </Typography>
                <TextField label="Server IP / Hostname" placeholder="e.g. 14.161.50.156"
                           value={ipInput} onChange={(e) => { setIpInput(e.target.value); setError(''); }}
                           size="small" fullWidth autoFocus />
                <TextField label="Port" placeholder="40420"
                           value={portInput} onChange={(e) => { setPortInput(e.target.value); setError(''); }}
                           size="small" fullWidth />
                <FormControlLabel
                    control={<Checkbox checked={devModeInput} onChange={(e) => setDevModeInput(e.target.checked)} size="small" />}
                    label={<Typography variant="body2" color="text.secondary">Dev Mode (skip public tick check)</Typography>}
                />
                {error && <Typography variant="body2" color="error" sx={{ mt: -1 }}>{error}</Typography>}
                <Stack direction="row" spacing={2} mt={1}>
                  <Button variant="outlined" color="inherit" fullWidth onClick={onClose} disabled={testing}>Cancel</Button>
                  <Button variant="contained" color="primary" fullWidth startIcon={<LinkIcon />}
                          onClick={handleConnect} disabled={testing}>
                    {testing ? 'Testing...' : 'Connect'}
                  </Button>
                </Stack>
              </>
          )}
        </DialogContent>
      </Dialog>
  );
};

export default ServerConnectModal;
