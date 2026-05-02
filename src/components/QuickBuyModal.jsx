import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQubicConnect } from './qubic/connect/QubicConnectContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { formatQubicAmount, byteArrayToHexString } from './qubic/util';
import { broadcastTransaction, getBasicInfo } from './qubic/util/bobApi';
import {
    buildQuotteryTx,
    packOrderPayload,
    QTRY_ADD_BID_ORDER,
} from './qubic/util/quotteryTx';
import { isEventClosed, validateOrderPreflight } from './qubic/util/tradeValidation';
import gcLogo from '../assets/gc.png';

const WHOLE_SHARE_PRICE = 100000;

const QuickBuyModal = ({ open, onClose, event, initialOption = 0, onTxBroadcast }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const { walletPublicIdentity, walletPublicKeyBytes, balance, quBalance, fetchQuBalance, getScheduledTick } = useQuotteryContext();
    const { bobUrl } = useConfig();
    const { showSnackbar } = useSnackbar();

    const [selectedOption, setSelectedOption] = useState(initialOption);
    const [shares, setShares] = useState(0);
    const [sharesInput, setSharesInput] = useState('');
    const [price, setPrice] = useState(50000);
    const [priceInput, setPriceInput] = useState('50000');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setSelectedOption(initialOption);
        }
    }, [open, initialOption]);

    const probability = ((price / WHOLE_SHARE_PRICE) * 100).toFixed(2);
    const cost = shares * price;

    const handleSubmit = async () => {
        if (!connected) { toggleConnectModal(); return; }
        if (!walletPublicIdentity || !walletPublicKeyBytes) {
            showSnackbar('Connect your wallet first.', 'error');
            return;
        }
        if (shares <= 0 || price <= 0 || price >= WHOLE_SHARE_PRICE) {
            showSnackbar('Enter valid shares and price.', 'error');
            return;
        }

        const eid = event?.eid ?? event?.eventId;
        if (eid === undefined || eid === null) {
            showSnackbar('Invalid event.', 'error');
            return;
        }

        const preflightError = validateOrderPreflight({
            event,
            option: selectedOption,
            side: 'buy',
            amount: shares,
            price,
            balance,
        });
        if (preflightError) {
            showSnackbar(preflightError, 'error');
            return;
        }

        setSubmitting(true);
        try {
            const [tickInfo, basicInfo] = await Promise.all([
                getScheduledTick(),
                getBasicInfo(bobUrl),
            ]);

            if (!tickInfo || !basicInfo) {
                showSnackbar('Failed to get network info.', 'error');
                return;
            }

            const { scheduledTick } = tickInfo;
            const antiSpamAmount = basicInfo.antiSpamAmount || 0;
            const latestQuBalance = walletPublicIdentity
                ? await fetchQuBalance(walletPublicIdentity)
                : quBalance;

            const fundedPreflightError = validateOrderPreflight({
                event,
                option: selectedOption,
                side: 'buy',
                amount: shares,
                price,
                balance,
                quBalance: latestQuBalance,
                antiSpamAmount,
            });
            if (fundedPreflightError) {
                showSnackbar(fundedPreflightError, 'error');
                return;
            }

            const payload = packOrderPayload(eid, selectedOption, shares, price);
            const packet = buildQuotteryTx(
                walletPublicKeyBytes,
                scheduledTick,
                QTRY_ADD_BID_ORDER,
                antiSpamAmount,
                payload
            );

            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            const txHex = typeof confirmed.tx === 'string'
                ? confirmed.tx
                : byteArrayToHexString(confirmed.tx);

            const res = await broadcastTransaction(bobUrl, txHex);

            if (res && !res.error) {
                const optDesc = selectedOption === 0 ? event.option0Desc : event.option1Desc;
                const hashInfo = res.txHash ? `\nTx: ${res.txHash}` : '';
                showSnackbar(
                    `Bid transaction broadcasted for tick ${scheduledTick}. Waiting for execution: ${shares} shares of "${optDesc}" @ ${formatQubicAmount(price)}${hashInfo}`,
                    'info'
                );
                if (onTxBroadcast) {
                    onTxBroadcast({
                        txHash: res.txHash,
                        scheduledTick,
                        description: `Bid ${shares} "${optDesc}" @ ${price}`,
                        type: 'order',
                        eventId: eid,
                        option: selectedOption,
                        side: 'buy',
                        amount: shares,
                        price,
                    });
                }
                onClose();
            } else {
                showSnackbar(`Broadcast failed: ${res?.error || 'Unknown error'}`, 'error');
            }
        } catch (err) {
            showSnackbar(`Error: ${err.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!event) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            fullWidth
            maxWidth="xs"
            BackdropProps={{ sx: { backdropFilter: 'blur(6px)' } }}
            PaperProps={{
                sx: { backgroundColor: theme.palette.background.paper },
                elevation: 3,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '0.3rem', backgroundColor: theme.palette.primary.main,
            }} />

            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, mr: 2 }} noWrap>
                    {event.desc}
                </Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 3 }}>
                <Stack spacing={2}>
                    {/* Option selector */}
                    <ToggleButtonGroup
                        value={selectedOption} exclusive
                        onChange={(_, v) => { if (typeof v === 'number') setSelectedOption(v); }}
                        size="small" fullWidth
                        sx={{
                            '& .MuiToggleButton-root': { flex: 1, textTransform: 'none', fontWeight: 600 },
                            '& .MuiToggleButton-root.Mui-selected': {
                                bgcolor: `${theme.palette.primary.main} !important`,
                                color: `${theme.palette.primary.contrastText} !important`,
                            },
                        }}
                    >
                        <ToggleButton value={0}>{event.option0Desc || 'Option 0'}</ToggleButton>
                        <ToggleButton value={1}>{event.option1Desc || 'Option 1'}</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Shares */}
                    <TextField
                        label="Shares" type="number" size="small" fullWidth
                        value={sharesInput}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') { setSharesInput(''); setShares(0); return; }
                            const n = raw.replace(/^0+(?=\d)/, '');
                            if (!/^\d+$/.test(n)) return;
                            setSharesInput(n);
                            setShares(Math.max(0, Number(n)));
                        }}
                        sx={{
                            '& input[type=number]': { MozAppearance: 'textfield' },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
                        }}
                    />

                    {/* Price */}
                    <TextField
                        label="Price (out of 100,000)" type="number" size="small" fullWidth
                        value={priceInput}
                        helperText={`Probability: ${probability}%`}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') { setPriceInput(''); setPrice(0); return; }
                            const n = raw.replace(/^0+(?=\d)/, '');
                            if (!/^\d+$/.test(n)) return;
                            const val = Math.min(99999, Math.max(0, Number(n)));
                            setPriceInput(String(val));
                            setPrice(val);
                        }}
                        sx={{
                            '& input[type=number]': { MozAppearance: 'textfield' },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
                        }}
                    />

                    {/* Quick price buttons */}
                    <Stack direction="row" spacing={1}>
                        {[10, 25, 50, 75, 90].map((pct) => (
                            <Button key={pct} variant="outlined" size="small"
                                    onClick={() => { const p = pct * 1000; setPrice(p); setPriceInput(String(p)); }}
                                    sx={{ minWidth: 0, px: 1, fontSize: 11 }}>
                                {pct}%
                            </Button>
                        ))}
                    </Stack>

                    {/* Cost */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Cost</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatQubicAmount(cost)}
                            </Typography>
                            <img src={gcLogo} alt="coin" width={14} height={14} />
                        </Box>
                    </Box>

                    {/* Balance */}
                    {connected && balance != null && (
                        <Typography variant="caption" color="text.secondary" textAlign="right">
                            Balance: {formatQubicAmount(balance)} GARTH
                        </Typography>
                    )}

                    {/* Submit */}
                    <Button
                        variant="contained" fullWidth size="medium"
                        onClick={handleSubmit}
                        disabled={submitting || isEventClosed(event) || shares <= 0 || price <= 0 || price >= WHOLE_SHARE_PRICE || Number(balance || 0) < cost}
                    >
                        {submitting ? 'Signing...' : 'Place Bid'}
                    </Button>

                    <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.3 }}>
                        Mint: matches if opposite option has bid ≥ {formatQubicAmount(WHOLE_SHARE_PRICE - price)}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default QuickBuyModal;
