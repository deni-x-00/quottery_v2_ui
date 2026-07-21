import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import gcLogo from '../../assets/gc.png';
import TradePriceSelector from './TradePriceSelector';
import TradeAmountSlider from './TradeAmountSlider';
import { useTranslation } from 'react-i18next';

const WHOLE_SHARE_PRICE = 100000;

const QuickBuyModal = ({ open, onClose, event, initialOption = 0, onTxBroadcast }) => {
    const { t } = useTranslation();
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
    const localizePreflightError = (error) => {
        if (!error) return '';
        if (error.startsWith('This event is closed')) return t('quickBuy.eventClosed');
        if (error.startsWith('Please enter a valid amount')) return t('quickBuy.validShares');
        if (error.startsWith('Price must be between')) return t('quickBuy.validPrice');
        const garthMatch = error.match(/^Insufficient GARTH balance\. Required (.+), available (.+)\.$/);
        if (garthMatch) return t('quickBuy.insufficientGarth', { required: garthMatch[1], available: garthMatch[2] });
        const quMatch = error.match(/^Insufficient QU balance for the anti-spam fee\. Required (.+), available (.+)\.$/);
        if (quMatch) return t('quickBuy.insufficientQu', { required: quMatch[1], available: quMatch[2] });
        return error;
    };
    const optionColor = (option) => (option === 0 ? theme.palette.success : theme.palette.error);
    const optionToggleSx = (option) => {
        const palette = optionColor(option);
        return {
            flex: 1,
            textTransform: 'none',
            fontWeight: 700,
            color: palette.main,
            bgcolor: alpha(palette.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
            borderColor: `${alpha(palette.main, 0.35)} !important`,
            '&:hover': {
                bgcolor: alpha(palette.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                borderColor: `${alpha(palette.main, 0.55)} !important`,
            },
            '&.Mui-selected': {
                bgcolor: `${palette.main} !important`,
                color: `${palette.contrastText} !important`,
                borderColor: `${palette.main} !important`,
            },
            '&.Mui-selected:hover': {
                bgcolor: `${palette.dark || palette.main} !important`,
            },
        };
    };

    useEffect(() => {
        if (open) {
            setSelectedOption(initialOption);
        }
    }, [open, initialOption]);

    const cost = shares * price;
    const maxShares = price > 0 ? Math.floor(Number(balance || 0) / price) : 0;

    const handleSubmit = async () => {
        if (!connected) { toggleConnectModal(); return; }
        if (!walletPublicIdentity || !walletPublicKeyBytes) {
            showSnackbar(t('quickBuy.connectFirst'), 'error');
            return;
        }
        if (shares <= 0 || price <= 0 || price >= WHOLE_SHARE_PRICE) {
            showSnackbar(t('quickBuy.validOrder'), 'error');
            return;
        }

        const eid = event?.eid ?? event?.eventId;
        if (eid === undefined || eid === null) {
            showSnackbar(t('quickBuy.invalidEvent'), 'error');
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
            showSnackbar(localizePreflightError(preflightError), 'error');
            return;
        }

        setSubmitting(true);
        try {
            const [tickInfo, basicInfo] = await Promise.all([
                getScheduledTick(),
                getBasicInfo(bobUrl),
            ]);

            if (!tickInfo || !basicInfo) {
                showSnackbar(t('quickBuy.networkInfoFailed'), 'error');
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
                showSnackbar(localizePreflightError(fundedPreflightError), 'error');
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

            showSnackbar(t('quickBuy.signTransaction'), 'info');
            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            const txHex = typeof confirmed.tx === 'string'
                ? confirmed.tx
                : byteArrayToHexString(confirmed.tx);

            const res = await broadcastTransaction(bobUrl, txHex);

            if (res && !res.error) {
                const optDesc = selectedOption === 0 ? event.option0Desc : event.option1Desc;
                if (onTxBroadcast) {
                    onTxBroadcast({
                        txHash: res.txHash,
                        scheduledTick,
                        description: t('quickBuy.transactionDescription', { amount: formatQubicAmount(shares), option: optDesc, price: formatQubicAmount(price) }),
                        inputType: QTRY_ADD_BID_ORDER,
                        type: 'order',
                        eventId: eid,
                        option: selectedOption,
                        side: 'buy',
                        amount: shares,
                        price,
                    });
                } else {
                    showSnackbar(
                        t('quickBuy.broadcasted', { tick: scheduledTick, amount: shares, option: optDesc, price: formatQubicAmount(price) }),
                        'info'
                    );
                }
                onClose();
            } else {
                showSnackbar(t('quickBuy.broadcastFailed', { error: res?.error || t('quickBuy.unknownError') }), 'error');
            }
        } catch (err) {
            showSnackbar(t('quickBuy.error', { error: err.message }), 'error');
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
                            '& .MuiToggleButton-root': { borderColor: theme.palette.divider },
                        }}
                    >
                        <ToggleButton value={0} sx={optionToggleSx(0)}>{event.option0Desc || t('eventDetails.option0')}</ToggleButton>
                        <ToggleButton value={1} sx={optionToggleSx(1)}>{event.option1Desc || t('eventDetails.option1')}</ToggleButton>
                    </ToggleButtonGroup>

                    <TradeAmountSlider
                        label={t('quickBuy.shares')}
                        value={sharesInput}
                        max={maxShares}
                        unit={t('quickBuy.shares')}
                        availableValue={balance}
                        availableUnit="GARTH"
                        disabled={submitting}
                        onChange={(nextValue) => {
                            setSharesInput(nextValue);
                            setShares(Math.max(0, Number(nextValue || 0)));
                        }}
                    />

                    <TradePriceSelector
                        value={priceInput}
                        disabled={submitting}
                        onChange={(nextValue) => {
                            setPriceInput(nextValue);
                            setPrice(Number(nextValue || 0));
                        }}
                    />

                    {/* Cost */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">{t('quickBuy.cost')}</Typography>
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
                            {t('quickBuy.balance', { amount: formatQubicAmount(balance) })}
                        </Typography>
                    )}

                    {/* Submit */}
                    <Button
                        variant="contained" fullWidth size="medium"
                        onClick={handleSubmit}
                        disabled={submitting || isEventClosed(event) || shares <= 0 || price <= 0 || price >= WHOLE_SHARE_PRICE || Number(balance || 0) < cost}
                    >
                        {submitting ? t('quickBuy.signing') : t('quickBuy.placeBuyOrder')}
                    </Button>

                    <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.3 }}>
                        {t('quickBuy.mintHint', { price: formatQubicAmount(WHOLE_SHARE_PRICE - price) })}
                    </Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default QuickBuyModal;
