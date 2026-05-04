import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Typography,
    useMediaQuery,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    Tabs,
    Tab,
    Alert,
} from "@mui/material";

import {
    ExpandMore as ExpandMoreIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    MonetizationOn as MonetizationOnIcon,
    HourglassBottom as HourglassBottomIcon,
    EventAvailable as EventAvailableIcon,
    Timeline as TimelineIcon,
    KeyboardReturn as KeyboardReturnIcon,
    Insights as InsightsIcon,
    Info as InfoIcon,
    ArrowBack as ArrowBackIcon,
    Help as HelpIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import AnimatedBars from "../components/qubic/ui/AnimateBars";
import ConfirmTxModal from "../components/qubic/connect/ConfirmTxModal";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import {
    formatQubicAmount,
    byteArrayToHexString,
} from "../components/qubic/util";
import { fetchEventDetail } from "../components/qubic/util/eventApi";
import { broadcastTransaction, getBasicInfo } from "../components/qubic/util/bobApi";
import {
    excludedEventIds,
} from "../components/qubic/util/commons";
import {
    buildQuotteryTx,
    packOrderPayload,
    packEventIdPayload,
    QTRY_ADD_BID_ORDER,
    QTRY_ADD_ASK_ORDER,
    QTRY_DISPUTE,
} from "../components/qubic/util/quotteryTx";
import { getPositionAmount, isEventClosed, validateOrderPreflight } from "../components/qubic/util/tradeValidation";

import gcLogo from "../assets/gc.png";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";
import { useTxTracker } from "../hooks/useTxTracker";
import { getTagInfo } from "../components/qubic/util/tagMap";
import TradeAmountSlider from "../components/TradeAmountSlider";
import TradePriceSelector from "../components/TradePriceSelector";
const thumbnails = require.context("../assets", false, /\.(png|jpe?g|svg|gif|webp)$/);
const resolveThumbnail = (name) => {
    try {
        return thumbnails(`./${name}`);
    } catch {
        return null;
    }
};

const formatBroadcastError = (error) => {
    const message = String(error?.message || error || "");
    if (/Tick value is Expired/i.test(message)) {
        return "Tick value is Expired. Try again.";
    }
    return `Failed to broadcast transaction: ${message || "Transaction broadcast failed"}`;
};

function EventDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery("(max-width:600px)");
    const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
    const {
        walletPublicIdentity,
        walletPublicKeyBytes,
        balance,
        quBalance,
        fetchQuBalance,
        eventPositions,
        getScheduledTick,
        buildOrderSideEntries,
        orderbook,
        obLoading,
        obError,
        fetchOrderbook
    } = useQuotteryContext();
    const { bobUrl } = useConfig();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showSnackbar } = useSnackbar();
    const { scheduleBalanceRefresh } = useBalanceNotifier();
    const { trackTx } = useTxTracker();
    const [showConfirmTxModal, setShowConfirmTxModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState(0);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [aiContextExpanded, setAiContextExpanded] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Trading box state
    const WHOLE_SHARE_PRICE = 100000;
    const [tradeSide, setTradeSide] = useState("buy");
    const [tradeAmount, setTradeAmount] = useState(0);
    const [tradePrice, setTradePrice] = useState(50000); // price out of 100k
    const [tradeAmountInput, setTradeAmountInput] = useState("");
    const [tradePriceInput, setTradePriceInput] = useState("50000");

    // Cost estimation: shares × price (in GARTH)
    const tradeCoins = Number(tradeAmount || 0) * Number(tradePrice || 0);
    const availableTradeShares = getPositionAmount(eventPositions, event?.eid, selectedOption);
    const maxTradeAmount = tradeSide === "sell"
        ? availableTradeShares
        : tradePrice > 0 ? Math.floor(Number(balance || 0) / tradePrice) : 0;
    const insufficientTradeResource = tradeSide === "buy"
        ? Number(balance || 0) < tradeCoins
        : availableTradeShares < Number(tradeAmount || 0);
    const tradeResourceError = tradeSide === "buy"
        ? `Insufficient GARTH: need ${formatQubicAmount(tradeCoins)}, available ${formatQubicAmount(balance || 0)}.`
        : `Insufficient shares: need ${formatQubicAmount(tradeAmount || 0)}, available ${formatQubicAmount(availableTradeShares)}.`;
    const tradeSubmitDisabled =
        submitting ||
        !connected ||
        isEventClosed(event) ||
        selectedOption === null ||
        tradeAmount <= 0 ||
        tradePrice <= 0 ||
        tradePrice >= 100000 ||
        insufficientTradeResource;

    // Order book UI state
    const [orderBookExpanded, setOrderBookExpanded] = useState(true);
    const [obTab, setObTab] = useState(0);

    const refreshData = useCallback(() => {
        if (!event || event.eid === undefined || event.eid < 0) return;
        fetchOrderbook(event.eid, () => false);
    }, [event, fetchOrderbook]);

    const updateEventDetails = useCallback(async () => {
        try {
            setLoading(true);
            if (!id || excludedEventIds.includes(parseInt(id))) {
                setEvent(null);
                navigate("/");
                return;
            }
            const eventId = parseInt(id);
            const updatedEvent = await fetchEventDetail(bobUrl, eventId);
            if (!updatedEvent) {
                setEvent(null);
                return;
            }
            setEvent(updatedEvent);
        } catch (error) {
            console.error("Error updating event details:", error);
        } finally {
            setLoading(false);
        }
    }, [id, bobUrl, navigate]);

    const renderOrderRows = useCallback(
        (entries, emptyLabel, isBidSide) => {
            const total = entries.reduce(
                (acc, o) => acc + Number(o?.amount || 0),
                0
            );
            let running = 0;

            if (entries.length === 0) {
                return (
                    <TableRow>
                        <TableCell colSpan={3}>
                            <Typography variant="body2" color="text.secondary">
                                {emptyLabel}
                            </Typography>
                        </TableCell>
                    </TableRow>
                );
            }

            return entries.map((o, i) => {
                const amt = Number(o?.amount || 0);
                running += amt;
                const pct = total > 0 ? (running / total) * 100 : 0;

                return (
                    <TableRow key={`${isBidSide ? "bid" : "ask"}-${i}`}>
                        <TableCell sx={{ minWidth: 120 }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    height: 24,
                                    width: "100%",
                                    minWidth: 100,
                                    overflow: "hidden",
                                    borderRadius: 0.5,
                                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                                }}
                            >
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        left: isBidSide ? 0 : undefined,
                                        right: isBidSide ? undefined : 0,
                                        width: `${pct}%`,
                                        bgcolor: alpha(
                                            isBidSide
                                                ? theme.palette.success.main
                                                : theme.palette.error.main,
                                            0.25
                                        ),
                                        borderRadius: 0.5,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: "absolute",
                                        inset: 0,
                                        px: 0.75,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: isBidSide ? "flex-start" : "flex-end",
                                        color: "text.primary",
                                        fontWeight: 600,
                                        zIndex: 1,
                                    }}
                                >
                                    {formatQubicAmount(running)}
                                </Typography>
                            </Box>
                        </TableCell>
                        <TableCell align="right">{formatQubicAmount(amt)}</TableCell>
                        <TableCell align="right">{formatQubicAmount(Number(o?.price ?? 0))}</TableCell>
                    </TableRow>
                );
            });
        },
        [theme.palette.error.main, theme.palette.success.main, theme.palette.text.primary]
    );

    // Fetch event details on mount
    useEffect(() => {
        updateEventDetails();
    }, [updateEventDetails]);

    // Fetch orderbook for current event
    useEffect(() => {
        if (!event || event.eid === undefined || event.eid < 0) return;
        let cancelled = false;
        const isCancelled = () => cancelled;
        fetchOrderbook(event.eid, isCancelled);
        return () => { cancelled = true; };
    }, [event, fetchOrderbook]);

    useEffect(() => {
        if (event?.desc) {
            document.title = event.desc;
        }
    }, [event]);

    // Automatic refresh every 60s
    useEffect(() => {
        if (!event || event.eid === undefined || event.eid < 0) return;
        const intervalId = setInterval(() => { refreshData(); }, 60000);
        return () => clearInterval(intervalId);
    }, [event, refreshData]);

    const handleTradeClick = async () => {
        if (submitting) return;
        if (!connected) {
            toggleConnectModal();
            return;
        }

        if (tradeAmount <= 0) {
            showSnackbar("Please enter a valid amount.", "error");
            return;
        }

        if (tradePrice <= 0 || tradePrice >= 100000) {
            showSnackbar("Price must be between 1 and 99,999.", "error");
            return;
        }

        if (!walletPublicIdentity) {
            showSnackbar("No wallet identity available.", "error");
            return;
        }

        if (!walletPublicKeyBytes) {
            showSnackbar("Wallet public key not found.", "error");
            return;
        }

        if (!event || event.eid === undefined) {
            showSnackbar("Invalid event. Cannot place order.", "error");
            return;
        }

        const preflightError = validateOrderPreflight({
            event,
            eventPositions,
            option: selectedOption,
            side: tradeSide,
            amount: tradeAmount,
            price: tradePrice,
            balance,
        });
        if (preflightError) {
            showSnackbar(preflightError, "error");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Fetch current tick and basic info (for antiSpamAmount)
            const [tickInfo, basicInfo] = await Promise.all([
                getScheduledTick(),
                getBasicInfo(bobUrl),
            ]);

            if (!tickInfo) {
                showSnackbar("Failed to get current tick from network.", "error");
                return;
            }
            if (!basicInfo) {
                showSnackbar("Failed to get contract info.", "error");
                return;
            }

            const { scheduledTick, tickRate: rate, offset } = tickInfo;
            console.log(`[handleTradeClick] adaptive scheduling: rate=${rate.toFixed(2)} t/s, offset=${offset}, scheduledTick=${scheduledTick}`);
            const antiSpamAmount = basicInfo.antiSpamAmount || 0;
            const latestQuBalance = walletPublicIdentity
                ? await fetchQuBalance(walletPublicIdentity)
                : quBalance;

            const fundedPreflightError = validateOrderPreflight({
                event,
                eventPositions,
                option: selectedOption,
                side: tradeSide,
                amount: tradeAmount,
                price: tradePrice,
                balance,
                quBalance: latestQuBalance,
                antiSpamAmount,
            });
            if (fundedPreflightError) {
                showSnackbar(fundedPreflightError, "error");
                return;
            }

            // 2. Determine procedure number
            const isBid = tradeSide === "buy";
            const inputType = isBid ? QTRY_ADD_BID_ORDER : QTRY_ADD_ASK_ORDER;

            // 3. Price is always user-set (probability out of 100,000)
            const price = tradePrice;

            // 4. Build payload: eventId(u64) + option(u64) + amount(u64) + price(u64) = 32 bytes
            const payload = packOrderPayload(event.eid, selectedOption, tradeAmount, price);

            // 5. Build full Qubic transaction packet
            const packet = buildQuotteryTx(
                walletPublicKeyBytes,
                scheduledTick,
                inputType,
                antiSpamAmount,
                payload
            );

            // 6. Sign via MetaMask Snap
            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            // 7. Broadcast
            const txHex =
                typeof confirmed.tx === "string"
                    ? confirmed.tx
                    : byteArrayToHexString(confirmed.tx);

            const res = await broadcastTransaction(bobUrl, txHex);

            if (res && !res.error) {
                const optDesc = selectedOption === 0 ? event.option0Desc : event.option1Desc;
                const hashInfo = res.txHash ? `\nTx: ${res.txHash}` : '';
                showSnackbar(
                    `Order transaction broadcasted for tick ${scheduledTick}. Waiting for execution: ${tradeSide === "buy" ? "Bid" : "Ask"} ${formatQubicAmount(tradeAmount)} "${optDesc}" @ ${formatQubicAmount(tradePrice)}${hashInfo}`,
                    "info"
                );
                trackTx({
                    txHash: res.txHash,
                    scheduledTick,
                    description: `${tradeSide === "buy" ? "Bid" : "Ask"} ${formatQubicAmount(tradeAmount)} "${optDesc}" @ ${formatQubicAmount(tradePrice)}`,
                    type: "order",
                    eventId: event.eid,
                    option: selectedOption,
                    side: tradeSide === "buy" ? "buy" : "sell",
                    amount: tradeAmount,
                    price: tradePrice,
                });
                scheduleBalanceRefresh(2000);
            } else {
                throw new Error(res?.error || "Transaction broadcast failed");
            }

            return confirmed;
        } catch (error) {
            showSnackbar(
                formatBroadcastError(error),
                "error"
            );
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const handleDispute = async () => {
        if (!connected) { toggleConnectModal(); return; }
        if (!walletPublicKeyBytes) {
            showSnackbar("Wallet public key not found.", "error");
            return;
        }
        if (!event || event.eid === undefined) {
            showSnackbar("Invalid event.", "error");
            return;
        }
        if (event.resultByGO === -1) {
            showSnackbar("No result published yet — nothing to dispute.", "error");
            return;
        }

        try {
            const [tickInfo, basicInfo] = await Promise.all([
                getScheduledTick(),
                getBasicInfo(bobUrl),
            ]);
            if (!tickInfo || !basicInfo) {
                showSnackbar("Failed to get network info.", "error");
                return;
            }

            const { scheduledTick } = tickInfo;
            const depositAmount = basicInfo.depositAmountForDispute || 0;

            const payload = packEventIdPayload(event.eid);
            const packet = buildQuotteryTx(
                walletPublicKeyBytes,
                scheduledTick,
                QTRY_DISPUTE,
                depositAmount,
                payload
            );

            const confirmed = await getSignedTx(packet);
            if (!confirmed) return;

            const txHex = typeof confirmed.tx === "string"
                ? confirmed.tx
                : byteArrayToHexString(confirmed.tx);

            const res = await broadcastTransaction(bobUrl, txHex);
            if (res && !res.error) {
                const hashInfo = res.txHash ? `\nTx: ${res.txHash}` : '';
                showSnackbar(`Dispute submitted for tick ${scheduledTick}${hashInfo}`, "success");
                trackTx({ txHash: res.txHash, scheduledTick, description: `Dispute event ${event.eid}` });
            } else {
                showSnackbar(`Dispute failed: ${res?.error || 'Unknown error'}`, "error");
            }
        } catch (err) {
            showSnackbar(`Dispute error: ${err.message}`, "error");
        }
    };

    // --- Main render ---
    if (loading) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: { xs: "100%", sm: "calc(600px * 1.2)", md: "calc(900px * 1.2)" },
                    mt: 12, mb: 4,
                }}
            >
                <Box textAlign="center" justifyContent="center" my={50}>
                    <AnimatedBars />
                </Box>
            </Container>
        );
    }

    if (!event || event.eid === undefined || event.eid < 0) {
        return (
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: { xs: "100%", sm: "calc(600px * 1.2)", md: "calc(900px * 1.2)" },
                    mt: 12, mb: 4, textAlign: "center",
                }}
            >
                <Typography variant="h6" color="text.secondary">
                    Event not found or invalid Event ID.
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<KeyboardReturnIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate("/")}
                >
                    Back to Home
                </Button>
            </Container>
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{
                mt: 12, mb: 4, pb: 10,
                maxWidth: { xs: "100%", sm: "calc(600px * 1.2)", md: "calc(900px * 1.2)" },
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: isMobile ? 0 : 4,
                    m: -1.6,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    position: "relative",
                }}
            >
                {/* Title bar */}
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton aria-label="go back" onClick={() => navigate("/")} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box
                        sx={{
                            width: { xs: 32, sm: 38 }, height: { xs: 32, sm: 38 },
                            backgroundColor: theme.palette.action.hover,
                            borderRadius: 1, display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0, overflow: "hidden", mr: 1.5,
                        }}
                    >
                        {(() => {
                            const tagInfo = getTagInfo(event?.tag);
                            const thumbSrc = tagInfo.thumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
                            return thumbSrc ? (
                                <img src={thumbSrc} alt={event?.desc || "event"}
                                     style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                                <HelpIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, color: theme.palette.text.secondary }} />
                            );
                        })()}
                    </Box>
                    <Typography color="text.primary" fontWeight={400}
                                sx={{ fontSize: { xs: "1.1rem", sm: "1.6rem" } }}>
                        {event.desc}
                    </Typography>
                </Box>

                {/* Main layout: left (details) | right (trading box) */}
                <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} md={8}>
                        {/* Close date and status */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <HourglassBottomIcon sx={{ fontSize: "1.2rem", color: theme.palette.text.secondary }} />
                                <Typography variant="body2"
                                            sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, color: theme.palette.text.secondary, whiteSpace: "nowrap" }}>
                                    {event.endDate}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    Result: {event.resultByGO === -1 ? 'Pending' : event.resultByGO === 0 ? event.option0Desc : event.option1Desc}
                                </Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ mb: theme.spacing(0) }} />

                        {/* Refresh icon */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5, mt: 1 }}>
                            <IconButton aria-label="refresh order book" size="small" onClick={refreshData} disabled={obLoading}>
                                <RefreshIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                            </IconButton>
                        </Box>

                        {/* ORDER BOOK ACCORDION */}
                        <Box sx={{ borderRadius: 1, mb: 2, padding: 0 }}>
                            <Accordion
                                sx={{ backgroundColor: theme.palette.background.default }}
                                expanded={orderBookExpanded}
                                onChange={() => setOrderBookExpanded((e) => !e)}
                                elevation={0}
                            >
                                <AccordionSummary
                                    expandIcon={
                                        orderBookExpanded
                                            ? <KeyboardArrowUpIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                            : <ExpandMoreIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                    }
                                >
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <MonetizationOnIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText, width: 20 }} />
                                        <Typography variant="body2"
                                                    color={theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText}>
                                            Order Book
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Tabs value={obTab} onChange={(_, v) => setObTab(v)}
                                          sx={{ mb: 1, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 }, "& .MuiTabs-indicator": { height: 3, borderRadius: 1.5 } }}>
                                        <Tab label={event?.option0Desc || "Option 0"} value={0} />
                                        <Tab label={event?.option1Desc || "Option 1"} value={1} />
                                    </Tabs>

                                    {obLoading && <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Loading order book...</Typography>}
                                    {obError && <Typography variant="body2" color="error" sx={{ py: 1 }}>{obError}</Typography>}

                                    {!obLoading && !obError && (
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Bids</Typography>
                                                <TableContainer component={Paper} elevation={0} variant="outlined"
                                                                sx={{ borderRadius: 1, maxHeight: 400, overflowY: "auto", scrollbarWidth: "none", "::-webkit-scrollbar": { width: 0 } }}>
                                                    <Table size="small" stickyHeader>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Depth</TableCell>
                                                                <TableCell align="right">Amount</TableCell>
                                                                <TableCell align="right">Price</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {renderOrderRows(buildOrderSideEntries(orderbook, obTab, "bids"), "No bids", true)}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Asks</Typography>
                                                <TableContainer component={Paper} elevation={0} variant="outlined"
                                                                sx={{ borderRadius: 1, maxHeight: 400, overflowY: "auto", scrollbarWidth: "none", "::-webkit-scrollbar": { width: 0 } }}>
                                                    <Table size="small" stickyHeader>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Depth</TableCell>
                                                                <TableCell align="right">Amount</TableCell>
                                                                <TableCell align="right">Price</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {renderOrderRows(buildOrderSideEntries(orderbook, obTab, "asks"), "No asks", false)}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        </Grid>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Box>

                        {/* AI CONTEXT ACCORDION */}
                        {event?.AIcontext && (
                            <Box sx={{ borderRadius: 1, mb: 3, padding: 0 }}>
                                <Accordion sx={{ backgroundColor: theme.palette.background.default }}
                                           expanded={aiContextExpanded} onChange={() => setAiContextExpanded((e) => !e)} elevation={0}>
                                    <AccordionSummary
                                        expandIcon={aiContextExpanded
                                            ? <KeyboardArrowUpIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                            : <ExpandMoreIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                        }>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <InsightsIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText, width: 20 }} />
                                            <Typography variant="body2"
                                                        color={theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText}>
                                                AI Context
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                            {event.AIcontext}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}

                        {/* MORE DETAILS ACCORDION */}
                        <Box sx={{ borderRadius: 1, mb: 3, padding: 0 }}>
                            <Accordion sx={{ backgroundColor: theme.palette.background.default }}
                                       expanded={detailsExpanded} onChange={() => setDetailsExpanded((e) => !e)} elevation={0}>
                                <AccordionSummary
                                    expandIcon={detailsExpanded
                                        ? <KeyboardArrowUpIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                        : <ExpandMoreIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText }} />
                                    }>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <InfoIcon sx={{ color: theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText, width: 20 }} />
                                        <Typography variant="body2"
                                                    color={theme.palette.mode === "dark" ? theme.palette.primary.main : theme.palette.primary.contrastText}>
                                            More Details
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        {[
                                            { icon: <EventAvailableIcon color="primary" />, label: "Open", value: event.openDate },
                                            { icon: <TimelineIcon color="success" />, label: "End", value: event.endDate },
                                        ].map((item, idx) => (
                                            <Grid item xs={12} md={6} key={idx}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    {item.icon}
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                                        <Typography variant="body2">{item.value}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {event.disputerId && (
                                        <Box mt={2}>
                                            <Typography variant="body2" color="text.secondary">
                                                Disputer: {event.disputerId} (Amount: {event.disputeAmount})
                                            </Typography>
                                            {(event.computorsVote0 > 0 || event.computorsVote1 > 0) && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    Computor votes — No: {event.computorsVote0} / Yes: {event.computorsVote1}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {/* Dispute button — visible when result is published but no dispute yet */}
                                    {event.resultByGO !== -1 && !event.disputerId && (
                                        <Box mt={2}>
                                            <Button
                                                variant="outlined"
                                                color="warning"
                                                size="small"
                                                onClick={handleDispute}
                                            >
                                                Dispute Result
                                            </Button>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                Requires deposit. Triggers computor vote to overturn the published result.
                                            </Typography>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    </Grid>

                    {/* TRADING BOX (right side) */}
                    <Grid item xs={12} md={4}>
                        <Box
                            sx={{
                                width: "100%", borderRadius: 2,
                                bgcolor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: 2, p: 1.5,
                                position: "sticky", top: theme.spacing(10),
                            }}
                        >
                            <Stack spacing={2}>
                                {/* Buy / Sell tabs */}
                                <Tabs value={tradeSide} onChange={(_, v) => v && setTradeSide(v)}
                                      variant="fullWidth" textColor="primary" indicatorColor="primary"
                                      sx={{ minHeight: 30, "& .MuiTab-root": { minHeight: 30, textTransform: "none", fontWeight: 600, fontSize: 13, py: 0.25 }, "& .MuiTabs-indicator": { height: 2, borderRadius: 1 } }}>
                                    <Tab label="Bid" value="buy" />
                                    <Tab label="Ask" value="sell" />
                                </Tabs>

                                {/* Option selector */}
                                <ToggleButtonGroup value={selectedOption} exclusive
                                                   onChange={(_, v) => setSelectedOption(typeof v === "number" ? v : selectedOption)}
                                                   size="small" fullWidth
                                                   sx={{
                                                       "& .MuiToggleButton-root": { flex: 1, textTransform: "none", fontWeight: 600, borderColor: theme.palette.divider },
                                                       "& .MuiToggleButton-root.Mui-selected": {
                                                           bgcolor: `${theme.palette.primary.main} !important`,
                                                           color: `${theme.palette.primary.contrastText} !important`,
                                                           borderColor: `${theme.palette.primary.main} !important`,
                                                       },
                                                   }}>
                                    <ToggleButton value={0}>{event?.option0Desc || "Option 0"}</ToggleButton>
                                    <ToggleButton value={1}>{event?.option1Desc || "Option 1"}</ToggleButton>
                                </ToggleButtonGroup>

                                <TradeAmountSlider
                                    label="Shares"
                                    value={tradeAmountInput}
                                    max={maxTradeAmount}
                                    unit="shares"
                                    availableValue={tradeSide === "buy" ? Number(balance || 0) : availableTradeShares}
                                    availableUnit={tradeSide === "buy" ? "GARTH" : "shares"}
                                    disabled={submitting}
                                    onChange={(nextValue) => {
                                        setTradeAmountInput(nextValue);
                                        setTradeAmount(Number(nextValue || 0));
                                    }}
                                />

                                <TradePriceSelector
                                    value={tradePriceInput}
                                    disabled={submitting}
                                    onChange={(nextValue) => {
                                        setTradePriceInput(nextValue);
                                        setTradePrice(Number(nextValue || 0));
                                    }}
                                />

                                {/* Cost estimation */}
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Cost</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatQubicAmount(tradeCoins)}</Typography>
                                        <img src={gcLogo} alt="coin" width={16} height={16} />
                                    </Box>
                                </Box>

                                {tradeAmount > 0 && insufficientTradeResource && (
                                    <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
                                        {tradeResourceError}
                                    </Alert>
                                )}

                                {/* Submit */}
                                <Button variant="contained" fullWidth size="medium"
                                        onClick={handleTradeClick}
                                        disabled={tradeSubmitDisabled}>
                                    {submitting ? "Signing..." : (tradeSide === "buy" ? "Place Bid" : "Place Ask")}
                                </Button>

                                {/* Matching info hint */}
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.3 }}>
                                    {tradeSide === "buy"
                                        ? `Mint: matches if a bid on the opposite option has price >= ${formatQubicAmount(WHOLE_SHARE_PRICE - tradePrice)}`
                                        : `Trade: matches if a bid on same option has price >= your ask price`
                                    }
                                </Typography>
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>

                <ConfirmTxModal
                    open={showConfirmTxModal}
                    onClose={() => setShowConfirmTxModal(false)}
                    onConfirm={async () => {}}
                />
            </Paper>
        </Container>
    );
}

export default EventDetailsPage;
