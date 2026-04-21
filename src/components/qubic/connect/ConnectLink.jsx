import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    useMediaQuery,
    IconButton,
    Paper,
    CircularProgress,
    Fade,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConnectModal from './ConnectModal';
import { useQubicConnect } from './QubicConnectContext';
import { useQuotteryContext } from '../../../contexts/QuotteryContext';
import { formatQubicAmount } from '../util';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const ConnectLink = () => {
    const { connected, showConnectModal, toggleConnectModal } = useQubicConnect();
    const { balance, quBalance, fetchBalance, fetchQuBalance, walletPublicIdentity } = useQuotteryContext();
    const theme = useTheme();
    const lg = useMediaQuery(theme.breakpoints.up('lg'));

    const [showBalanceBubble, setShowBalanceBubble] = useState(false);
    const [loadingBalances, setLoadingBalances] = useState(false);
    const bubbleRef = useRef(null);
    const buttonRef = useRef(null);

    const icon = connected ? (
        <AccountBalanceWalletIcon
            sx={{ color: theme.palette.primary.main }}
        />
    ) : (
        <LockOpenIcon color='tertiary' />
    );

    const handleBalanceClick = async (e) => {
        if (!connected) {
            toggleConnectModal();
            return;
        }

        // Toggle bubble
        if (showBalanceBubble) {
            setShowBalanceBubble(false);
            return;
        }

        setShowBalanceBubble(true);
        setLoadingBalances(true);

        try {
            await Promise.all([
                fetchBalance(walletPublicIdentity),
                fetchQuBalance(walletPublicIdentity),
            ]);
        } finally {
            setLoadingBalances(false);
        }
    };

    // Close bubble on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                bubbleRef.current && !bubbleRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setShowBalanceBubble(false);
            }
        };
        if (showBalanceBubble) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showBalanceBubble]);

    return (
        <>
            <Box sx={{ position: 'relative' }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {lg ? (
                        <Button
                            ref={buttonRef}
                            onClick={handleBalanceClick}
                            variant='outlined'
                            color={connected ? 'primary' : 'tertiary'}
                            startIcon={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {icon}
                                </Box>
                            }
                        >
                            <Typography variant='body1' fontWeight='bold' sx={{ letterSpacing: 0.5 }}>
                                {connected ? `${formatQubicAmount(balance)} GARTH` : 'UNLOCK WALLET'}
                            </Typography>
                        </Button>
                    ) : (
                        <IconButton
                            ref={buttonRef}
                            onClick={handleBalanceClick}
                            sx={{
                                p: 0.5,
                                backgroundColor: 'transparent',
                                '&:hover': { backgroundColor: 'transparent' },
                                color: theme.palette.mode === 'dark'
                                    ? theme.palette.primary.contrastText
                                    : theme.palette.text.primary,
                            }}
                        >
                            {icon}
                        </IconButton>
                    )}
                </motion.div>

                {/* Balance bubble */}
                <Fade in={showBalanceBubble}>
                    <Paper
                        ref={bubbleRef}
                        elevation={8}
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            mt: 1,
                            p: 2,
                            minWidth: 220,
                            zIndex: theme.zIndex.tooltip,
                            borderRadius: 2,
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        {loadingBalances ? (
                            <Box display="flex" justifyContent="center" py={1}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        GARTH Balance
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700}>
                                        {formatQubicAmount(balance ?? 0)} GARTH
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        QU Balance
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700}>
                                        {quBalance !== null ? `${formatQubicAmount(quBalance)} QU` : 'Unavailable'}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="text" size="small"
                                    onClick={(e) => { e.stopPropagation(); toggleConnectModal(); setShowBalanceBubble(false); }}
                                    sx={{ textTransform: 'none', fontWeight: 600, justifyContent: 'flex-start', px: 0 }}
                                >
                                    Wallet Settings
                                </Button>
                            </Stack>
                        )}
                    </Paper>
                </Fade>
            </Box>

            <ConnectModal open={showConnectModal} onClose={toggleConnectModal} />
        </>
    );
};

export default ConnectLink;
