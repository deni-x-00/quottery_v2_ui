import { MetaMaskLogo } from './MetaMaskLogo.jsx';
import { MetaMaskFlaskLogo } from './MetaMaskFlaskLogo.jsx';

import { Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const connectButtonSx = {
  minHeight: 44,
  borderRadius: 1,
  textTransform: 'none',
  fontWeight: 900,
};

export const InstallButton = () => {
  const { t } = useTranslation();
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={() => (window.location.href = 'https://metamask.io/')}
      startIcon={<MetaMaskLogo />}
      sx={connectButtonSx}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('walletConnect.installMetaMask')}
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
      sx={connectButtonSx}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('walletConnect.connect')}
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
      sx={connectButtonSx}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('walletConnect.reconnect')}
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
      sx={connectButtonSx}
      fullWidth
    >
      <Typography variant="button" fontWeight="bold">
        {t('walletConnect.connected')}
      </Typography>
    </Button>
  );
};
