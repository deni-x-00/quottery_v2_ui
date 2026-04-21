import { MetaMaskLogo } from './MetaMaskLogo.jsx';
import { MetaMaskFlaskLogo } from './MetaMaskFlaskLogo.jsx';

import { useTranslation } from 'react-i18next';
import { Button, Typography } from '@mui/material';
export const InstallButton = () => {
  const { t } = useTranslation();

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={() => (window.location.href = 'https://metamask.io/')}
      startIcon={<MetaMaskLogo />}
      sx={{ fontWeight: 600 }}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('connect.Install MetaMask')}
      </Typography>
    </Button>
  );
};

export const ConnectButton = (props) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={props.onClick}
      startIcon={props.isFlask ? <MetaMaskFlaskLogo /> : <MetaMaskLogo />}
      sx={{ fontWeight: 600 }}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('Connect')}
      </Typography>
    </Button>
  );
};

export const ReconnectButton = (props) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={props.onClick}
      startIcon={<MetaMaskLogo />}
      sx={{ fontWeight: 600 }}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('Reconnect')}
      </Typography>
    </Button>
  );
};

export const HeaderButtons = ({ state, onConnectClick }) => {
  const { t } = useTranslation();

  if (!state.snapsDetected && !state.installedSnap) {
    return <InstallButton />;
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} isFlask={state.isFlask} />;
  }

  if (state.installedSnap) {
    return <ReconnectButton onClick={onConnectClick} />;
  }

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      disabled
      startIcon={<MetaMaskLogo />}
      sx={{ fontWeight: 600 }}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('Connected')}
      </Typography>
    </Button>
  );
};
