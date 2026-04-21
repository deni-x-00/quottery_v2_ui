import { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useQubicConnect } from './QubicConnectContext';
import { HeaderButtons } from './Buttons';
import { MetaMaskContext } from './MetamaskContext';
import { ReactComponent as MetaMaskLogo } from '../../../assets/metamask-clean.svg';
import { useWalletConnect } from './WalletConnectContext';
import { generateQRCode } from '../../../utils';
import WalletConnectLogo from '../../../assets/wallet-connect.svg';
import { useTranslation } from 'react-i18next';
import AccountSelector from './AccountSelector';
import { useQuotteryContext } from '../../../contexts/QuotteryContext';

export const MetamaskActions = Object.freeze({
  SetInstalled: 'SetInstalled',
  SetSnapsDetected: 'SetSnapsDetected',
  SetError: 'SetError',
  SetIsFlask: 'SetIsFlask',
});

const ConnectModal = ({ open, onClose, darkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [state] = useContext(MetaMaskContext);
  const { t } = useTranslation();

  const [selectedMode, setSelectedMode] = useState('none');
  const {
    connect,
    disconnect,
    connected,
    mmSnapConnect,
  } = useQubicConnect();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [connectionURI, setConnectionURI] = useState('');
  const {
    connect: walletConnectConnect,
    isConnected,
    requestAccounts,
  } = useWalletConnect();
  const { walletPublicIdentity, balance, eventPositions } = useQuotteryContext();

  const generateURI = async () => {
    const { uri, approve } = await walletConnectConnect();
    setConnectionURI(uri);
    const result = await generateQRCode(uri);
    setQrCode(result);
    await approve();
  };

  useEffect(() => {
    if (isConnected) {
      const fetchAccounts = async () => {
        const accounts = await requestAccounts();
        setAccounts(
            accounts.map((account) => ({
              publicId: account.address,
              alias: account.name,
            }))
        );
        setSelectedMode('account-select');
      };
      fetchAccounts();
    }
  }, [isConnected, requestAccounts]);

  const handleClose = () => {
    setSelectedMode('none');
    onClose();
  };

  return (
      <Dialog
          open={open}
          onClose={handleClose}
          fullScreen={isMobile}
          fullWidth
          maxWidth='xs'
          BackdropProps={{ sx: { backdropFilter: 'blur(8px)' } }}
          PaperProps={{
            sx: { elevation: 'none !important', p: isMobile ? 0 : 1, py: isMobile ? 1 : 0, backgroundColor: theme.palette.background.card },
            elevation: 2,
          }}
      >
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '0.4rem', backgroundColor: theme.palette.primary.main }} />

        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box display='flex' alignItems='center' gap={1}>
            <PhonelinkIcon fontSize='small' sx={{ color: theme.palette.text.primary }} />
            <Typography variant='h6' color={theme.palette.text.primary} sx={{ fontWeight: 600 }}>
              qubic <span style={{ color: theme.palette.primary.main }}>connect</span>
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size='small'><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {selectedMode === 'none' && (
              <Fade in={selectedMode === 'none'} timeout={300}>
                <Box display='flex' flexDirection='column' gap={2}>
                  {connected && (
                      <>
                        <Box sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
                          <Typography variant='overline' color='text.secondary'>Identity</Typography>
                          <Typography variant='body2' sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {walletPublicIdentity || '-'}
                          </Typography>
                          <Box mt={1} />
                          <Typography variant='overline' color='text.secondary'>Balance (GARTH)</Typography>
                          <Typography variant='body2'>
                            {balance !== null && balance !== undefined ? balance : '-'}
                          </Typography>
                          {eventPositions && eventPositions.length > 0 && (
                              <>
                                <Box mt={1} />
                                <Typography variant='overline' color='text.secondary'>Positions</Typography>
                                {eventPositions.map((position, idx) => (
                                    <Typography key={`${position.eventId}-${position.option}-${idx}`} variant='body2'>
                                      Event {position.eventId} – Option {position.option}:{' '}
                                      {position.amount} share{position.amount !== 1 ? 's' : ''}
                                    </Typography>
                                ))}
                              </>
                          )}
                        </Box>
                        <Button variant='outlined' color='primary' size='large'
                                startIcon={<AccountBalanceWalletIcon />}
                                onClick={() => disconnect()} fullWidth sx={{ mt: 1 }}>
                          <Typography variant='button' fontWeight='bold'>{t('Disconnect Wallet')}</Typography>
                        </Button>
                      </>
                  )}
                  {!connected && (
                      <>
                        <Box textAlign='center' mb={2}>
                          <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />
                          <Typography variant='body1' color='text.secondary' mt={1}>
                            Choose your preferred connection method
                          </Typography>
                        </Box>
                        <Button variant='outlined' color='primary' size='large'
                                startIcon={<MetaMaskLogo style={{ width: 24, height: 24 }} />}
                                onClick={() => setSelectedMode('metamask')}
                                disabled={isMobile} fullWidth sx={{ mb: 1 }}>
                          <Typography variant='button' fontWeight='bold'>METAMASK</Typography>
                        </Button>
                        <Button variant='outlined' color='primary' size='large'
                                startIcon={<img src={WalletConnectLogo} alt='Wallet Connect Logo' style={{ width: 24, height: 24 }} />}
                                onClick={() => { generateURI(); setSelectedMode('walletconnect'); }}
                                fullWidth sx={{ mb: 2 }}>
                          <Typography variant='button' fontWeight='bold'>WALLET CONNECT</Typography>
                        </Button>
                      </>
                  )}
                </Box>
              </Fade>
          )}

          {selectedMode === 'account-select' && (
              <Grow in={selectedMode === 'account-select'} timeout={300}>
                <Box>
                  <Typography variant='body1' mb={2} color='text.secondary'>
                    {t('connect.Select an account:')}
                  </Typography>
                  <AccountSelector
                      label={t('Account')}
                      options={accounts.map((account, idx) => ({
                        label: account.alias || `Account ${idx + 1}`,
                        value: account.publicId,
                      }))}
                      selected={selectedAccount}
                      setSelected={setSelectedAccount}
                  />
                  <Box display='flex' gap={2} mt={3} justifyContent='center'>
                    <Button variant='outlined' color='secondary' size='large'
                            onClick={() => { disconnect(); setSelectedMode('none'); }}
                            sx={{ fontWeight: 600 }}>
                      {t('connect.Lock Wallet')}
                    </Button>
                    <Button variant='contained' color='primary' size='large'
                            onClick={() => {
                              connect({
                                connectType: 'walletconnect',
                                publicKey: accounts[parseInt(selectedAccount.toString())]?.publicId,
                                alias: accounts[parseInt(selectedAccount.toString())]?.alias,
                              });
                              setSelectedMode('none');
                              onClose();
                            }}
                            sx={{ fontWeight: 600 }}>
                      {t('connect.Select Account')}
                    </Button>
                  </Box>
                </Box>
              </Grow>
          )}

          {selectedMode === 'metamask' && (
              <Grow in={selectedMode === 'metamask'} timeout={300}>
                <Box>
                  <Typography variant='body1' mb={3} textAlign='center' color='text.secondary'>
                    Connect your MetaMask wallet. You need to have MetaMask installed and unlocked.
                  </Typography>
                  <Box display='flex' flexDirection='column' gap={2}>
                    <HeaderButtons state={state} onConnectClick={() => { mmSnapConnect(); setSelectedMode('none'); onClose(); }} />
                    <Button variant='outlined' color='secondary' size='large'
                            onClick={() => setSelectedMode('none')} sx={{ fontWeight: 600 }}>
                      {t('Cancel')}
                    </Button>
                  </Box>
                </Box>
              </Grow>
          )}

          {selectedMode === 'walletconnect' && (
              <Grow in={selectedMode === 'walletconnect'} timeout={300}>
                <Box>
                  <Typography variant='body1' mb={3} textAlign='center' color='text.secondary'>
                    {t('Connect your Qubic Wallet. You need to have Qubic Wallet installed and unlocked.')}
                  </Typography>
                  <Box display='flex' flexDirection='column' gap={2}>
                    <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center'
                         sx={{ minWidth: 216, minHeight: 216 }}>
                      {qrCode ? (
                          <img src={qrCode} alt='Wallet Connect QR Code' style={{ width: 216, height: 216 }} />
                      ) : (
                          <Box sx={{
                            width: 32, height: 32,
                            border: `2px solid ${theme.palette.text.primary}`,
                            borderTop: `2px solid transparent`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                          }} />
                      )}
                    </Box>
                    <Button variant='outlined' color='primary' size='large'
                            onClick={() => window.open(`qubic-wallet://pairwc/${connectionURI}`, '_blank')}
                            disabled={!connectionURI || !isMobile} sx={{ fontWeight: 600 }}>
                      {t('connect.Open in Qubic Wallet')}
                    </Button>
                    <Button variant='outlined' color='secondary' size='large'
                            onClick={() => setSelectedMode('none')} sx={{ fontWeight: 600 }}>
                      {t('Cancel')}
                    </Button>
                  </Box>
                </Box>
              </Grow>
          )}
        </DialogContent>
      </Dialog>
  );
};

export default ConnectModal;
