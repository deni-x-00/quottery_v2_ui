import React, { useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Grid,
    IconButton,
    Paper,
    Typography,
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
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";
import ConfirmTxModal from "../components/qubic/connect/ConfirmTxModal";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import {
    formatQubicAmount,
} from "../components/qubic/util";
import { getPositionAmount, isEventClosed } from "../components/qubic/util/tradeValidation";

import gcLogo from "../../assets/gc.png";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";
import { useEventOrderbook, useEventTradeActions, useQubicEventDetail } from "../hooks/data";
import { useTxTracker } from "../hooks/useTxTracker";
import TradeAmountSlider from "../components/TradeAmountSlider";
import TradePriceSelector from "../components/TradePriceSelector";
import EventHeader from "../components/EventHeader";
import EventRules from "../components/EventRules";
import { EmptyState, LoadingSkeleton, PageShell } from "../components/ui";
import { StatusBadge } from "../components/ui";
import { calculateOptionProbability } from "../utils/eventProbability";
import { formatPercent, formatPrice, formatPricePercent } from "../utils/format";
import usePageTitle from "../hooks/usePageTitle";
import { useTranslation } from "react-i18next";
const thumbnails = require.context("../../assets", true, /\.(png|jpe?g|svg|gif|webp)$/);
const resolveThumbnail = (name) => {
    try {
        return thumbnails(`./${name}`);
    } catch {
        return null;
    }
};

function EventDetailsPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
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
    const { showSnackbar } = useSnackbar();
    const { scheduleBalanceRefresh } = useBalanceNotifier();
    const { trackTx } = useTxTracker();
    const [showConfirmTxModal, setShowConfirmTxModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState(0);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [aiContextExpanded, setAiContextExpanded] = useState(false);
    const backTarget = location.state?.from || "/markets";
    const handleBack = useCallback(() => {
        navigate(backTarget);
    }, [backTarget, navigate]);
    const handleInvalidEventId = useCallback(() => {
        navigate(backTarget);
    }, [backTarget, navigate]);
    const { event, loading } = useQubicEventDetail(id, bobUrl, {
        onInvalidId: handleInvalidEventId,
    });
    const { placeOrder, dispute, submitting } = useEventTradeActions({
        connected,
        toggleConnectModal,
        walletPublicIdentity,
        walletPublicKeyBytes,
        balance,
        quBalance,
        fetchQuBalance,
        eventPositions,
        getScheduledTick,
        getSignedTx,
        bobUrl,
        showSnackbar,
        trackTx,
        scheduleBalanceRefresh,
    });
    usePageTitle(event?.desc || (id ? t("eventDetails.eventFallback", { id }) : t("eventDetails.event")));

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
        ? t("eventDetails.insufficientGarth", {
            needed: formatQubicAmount(tradeCoins),
            available: formatQubicAmount(balance || 0),
        })
        : t("eventDetails.insufficientShares", {
            needed: formatQubicAmount(tradeAmount || 0),
            available: formatQubicAmount(availableTradeShares),
        });
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
    const option0Probability = calculateOptionProbability(orderbook, 0);
    const option0Percent = Number.isFinite(Number(option0Probability?.percent))
        ? Math.max(0, Math.min(100, Number(option0Probability.percent)))
        : null;
    const optionChanceTexts = option0Percent === null
        ? null
        : [formatPercent(option0Percent), formatPercent(100 - option0Percent)];
    const optionColor = (option) => (option === 0 ? theme.palette.success : theme.palette.error);
    const optionToggleSx = (option) => {
        const palette = optionColor(option);
        return {
            flex: 1,
            textTransform: "none",
            fontWeight: 700,
            color: palette.main,
            bgcolor: alpha(palette.main, theme.palette.mode === "dark" ? 0.14 : 0.08),
            borderColor: `${alpha(palette.main, 0.35)} !important`,
            "&:hover": {
                bgcolor: alpha(palette.main, theme.palette.mode === "dark" ? 0.22 : 0.14),
                borderColor: `${alpha(palette.main, 0.55)} !important`,
            },
            "&.Mui-selected": {
                bgcolor: `${palette.main} !important`,
                color: `${palette.contrastText} !important`,
                borderColor: `${palette.main} !important`,
            },
            "&.Mui-selected:hover": {
                bgcolor: `${palette.dark || palette.main} !important`,
            },
        };
    };
    const optionTabSx = (option) => {
        const palette = optionColor(option);
        return {
            color: palette.main,
            borderRadius: 1,
            "&.Mui-selected": {
                color: palette.main,
                bgcolor: alpha(palette.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
            },
        };
    };
    const tradeSideColor = (side) => (side === "buy" ? theme.palette.success : theme.palette.error);
    const tradeSideTabSx = (side) => {
        const palette = tradeSideColor(side);
        return {
            color: palette.main,
            borderRadius: 1,
            "&.Mui-selected": {
                color: palette.main,
                bgcolor: alpha(palette.main, theme.palette.mode === "dark" ? 0.16 : 0.1),
            },
        };
    };

    const renderOrderBookSide = useCallback(
        (entries, side) => {
            const isBidSide = side === "bids";
            const color = isBidSide ? theme.palette.success.main : theme.palette.error.main;
            const visibleEntries = entries;
            let runningDepth = 0;
            let runningTotal = 0;
            const rowsInBookOrder = visibleEntries.map((entry) => {
                const amount = Number(entry?.amount || 0);
                const price = Number(entry?.price || 0);
                runningDepth += amount;
                runningTotal += amount * price;
                return {
                    amount,
                    price,
                    depth: runningDepth,
                    total: runningTotal,
                };
            });
            const maxDepth = rowsInBookOrder[rowsInBookOrder.length - 1]?.depth || 0;
            const rows = isBidSide ? rowsInBookOrder : [...rowsInBookOrder].reverse();

            if (visibleEntries.length === 0) {
                return (
                    <Box sx={{ py: 2.25, px: 1.5, color: "text.secondary", fontSize: "0.82rem" }}>
                        {t(isBidSide ? "eventDetails.noBuyOrders" : "eventDetails.noSellOrders")}
                    </Box>
                );
            }

            return (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "56px minmax(0, 1fr)", sm: "84px minmax(0, 1fr)" },
                        borderBottom: `1px solid ${theme.palette.border.soft}`,
                    }}
                >
                    <Box
                        sx={{
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <Stack>
                            {rows.map((row, index) => {
                                const depthPct = maxDepth > 0 ? Math.max(12, (row.depth / maxDepth) * 100) : 0;
                                return (
                                    <Box
                                        key={`${side}-depth-${row.price}-${index}`}
                                        sx={{
                                            position: "relative",
                                            height: 36,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                left: 0,
                                                width: `${depthPct}%`,
                                                bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.36 : 0.2),
                                                borderLeft: `10px solid ${alpha(color, theme.palette.mode === "dark" ? 0.38 : 0.24)}`,
                                                borderTopRightRadius: index === 0 ? 4 : 0,
                                                borderBottomRightRadius: index === rows.length - 1 ? 4 : 0,
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                    <Stack>
                        {rows.map((row, index) => {
                            return (
                                <Box
                                    key={`${side}-${row.price}-${index}`}
                                    sx={{
                                        position: "relative",
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                        alignItems: "center",
                                        minHeight: 36,
                                        px: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    <Typography
                                        align="center"
                                        sx={{
                                            position: "relative",
                                            zIndex: 1,
                                            color,
                                            fontFamily: "var(--quottery-font-mono)",
                                            fontSize: { xs: "0.74rem", sm: "0.82rem" },
                                            fontWeight: 800,
                                        }}
                                    >
                                        {formatPrice(row.price)}
                                    </Typography>
                                    <Typography
                                        align="center"
                                        sx={{
                                            position: "relative",
                                            zIndex: 1,
                                            color: "text.primary",
                                            fontFamily: "var(--quottery-font-mono)",
                                            fontSize: { xs: "0.78rem", sm: "0.88rem" },
                                            fontWeight: 750,
                                        }}
                                    >
                                        {formatQubicAmount(row.amount)}
                                    </Typography>
                                    <Typography
                                        align="center"
                                        sx={{
                                            position: "relative",
                                            zIndex: 1,
                                            color: "text.primary",
                                            fontFamily: "var(--quottery-font-mono)",
                                            fontSize: { xs: "0.78rem", sm: "0.88rem" },
                                            fontWeight: 750,
                                        }}
                                    >
                                        {formatQubicAmount(row.total)}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            );
        },
        [t, theme]
    );

    const renderOrderBookPanel = useCallback(() => {
        const bids = buildOrderSideEntries(orderbook, obTab, "bids");
        const asks = buildOrderSideEntries(orderbook, obTab, "asks");
        const bestBid = bids[0]?.price;
        const bestAsk = asks[0]?.price;
        const spread = Number.isFinite(Number(bestBid)) && Number.isFinite(Number(bestAsk))
            ? Number(bestAsk) - Number(bestBid)
            : null;
        const optionLabel = obTab === 0 ? t("eventDetails.yes") : t("eventDetails.no");

        return (
            <Box
                sx={{
                    overflow: "hidden",
                    bgcolor: "transparent",
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "56px repeat(3, minmax(0, 1fr))", sm: "84px repeat(3, minmax(0, 1fr))" },
                        alignItems: "center",
                        gap: 0,
                        px: { xs: 0, sm: 0 },
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.border.soft}`,
                    }}
                >
                    <Typography sx={{ color: "text.secondary", fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        {t("eventDetails.tradeOption", { option: optionLabel })}
                    </Typography>
                    <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        {t("eventDetails.price")}
                    </Typography>
                    <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        {t("eventDetails.shares")}
                    </Typography>
                    <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" }}>
                        {t("eventDetails.total")}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        maxHeight: { xs: 292, sm: 328, md: 364 },
                        overflowY: "auto",
                        overflowX: "hidden",
                        scrollbarWidth: "thin",
                        scrollbarColor: `${alpha(theme.palette.text.secondary, 0.35)} transparent`,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": {
                            bgcolor: alpha(theme.palette.text.secondary, 0.28),
                            borderRadius: 999,
                        },
                        "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
                    }}
                >
                    {renderOrderBookSide(asks, "asks")}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "56px repeat(3, minmax(0, 1fr))", sm: "84px repeat(3, minmax(0, 1fr))" },
                            alignItems: "center",
                            px: 0,
                            py: 0.75,
                            borderTop: `1px solid ${theme.palette.border.soft}`,
                            borderBottom: `1px solid ${theme.palette.border.soft}`,
                        }}
                    >
                        <Box />
                        <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.74rem", fontWeight: 750 }}>
                            {t("eventDetails.bid", { value: bestBid === undefined ? "-" : formatPrice(bestBid) })}
                        </Typography>
                        <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.76rem", fontWeight: 800 }}>
                            {t("eventDetails.spread", { value: spread === null ? "-" : formatPricePercent(Math.max(0, spread)) })}
                        </Typography>
                        <Typography align="center" sx={{ color: "text.secondary", fontSize: "0.74rem", fontWeight: 750 }}>
                            {t("eventDetails.ask", { value: bestAsk === undefined ? "-" : formatPrice(bestAsk) })}
                        </Typography>
                    </Box>
                    {renderOrderBookSide(bids, "bids")}
                </Box>
            </Box>
        );
    }, [buildOrderSideEntries, obTab, orderbook, renderOrderBookSide, t, theme]);

    const { refreshData } = useEventOrderbook(event, fetchOrderbook);

    const handleTradeClick = useCallback(() => placeOrder({
        event,
        selectedOption,
        tradeSide,
        tradeAmount,
        tradePrice,
    }), [event, placeOrder, selectedOption, tradeAmount, tradePrice, tradeSide]);

    const handleDispute = useCallback(() => dispute(event), [dispute, event]);

    // --- Main render ---
    if (loading) {
        return (
            <PageShell top={12} bottom={4}>
                <LoadingSkeleton variant="panel" rows={5} columns={3} />
            </PageShell>
        );
    }

    if (!event || event.eid === undefined || event.eid < 0) {
        return (
            <PageShell top={12} bottom={4} sx={{ textAlign: "center" }}>
                <EmptyState
                    tone="warning"
                    title={t("eventDetails.notFound")}
                    description={t("eventDetails.invalidEvent")}
                    action={(
                        <Button
                            variant="outlined"
                            startIcon={<KeyboardReturnIcon />}
                            onClick={handleBack}
                        >
                            {t("eventDetails.back")}
                        </Button>
                    )}
                />
            </PageShell>
        );
    }

    const eventEnded = isEventClosed(event);
    const timerColor = eventEnded ? theme.palette.error.main : theme.palette.primary.main;

    return (
        <PageShell top={{ xs: 4, md: 6 }} bottom={4} sx={{ pb: 10 }}>
            <Paper
                elevation={0}
                sx={{
                    p: 0,
                    m: 0,
                    borderRadius: 0,
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    position: "relative",
                }}
            >
                <EventHeader event={event} onBack={handleBack} resolveThumbnail={resolveThumbnail} />

                {/* Main layout: left (details) | right (trading box) */}
                <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
                    <Grid item xs={12} md={8}>
                        {/* Close date and status */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: { xs: "flex-start", sm: "center" },
                                justifyContent: "space-between",
                                gap: 1.5,
                                mb: 2,
                                p: 1.5,
                                borderRadius: 1.5,
                                border: `1px solid ${theme.palette.border.soft}`,
                                bgcolor: theme.palette.surface[1],
                                flexDirection: { xs: "column", sm: "row" },
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={1}>
                                <HourglassBottomIcon sx={{ fontSize: "1.2rem", color: timerColor }} />
                                <Typography variant="body2"
                                            sx={{ fontSize: { xs: "0.86rem", sm: "0.94rem" }, color: timerColor, whiteSpace: "nowrap", fontWeight: 800 }}>
                                    {event.endDate}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} sx={{ flexWrap: "wrap" }}>
                                <StatusBadge
                                    status={event.resultByGO === -1 ? "pending" : "resolved"}
                                    label={event.resultByGO === -1
                                        ? t("eventDetails.pending")
                                        : t("eventDetails.result", { option: event.resultByGO === 0 ? event.option0Desc : event.option1Desc })}
                                />
                                <IconButton
                                    aria-label={t("eventDetails.refreshOrderBook")}
                                    size="small"
                                    onClick={refreshData}
                                    disabled={obLoading}
                                    sx={{
                                        width: 34,
                                        height: 34,
                                        border: `1px solid ${theme.palette.border.soft}`,
                                        bgcolor: theme.palette.surface[2],
                                        color: "text.secondary",
                                        "&:hover": {
                                            color: "text.primary",
                                            borderColor: theme.palette.border.default,
                                            bgcolor: theme.palette.surface[3],
                                        },
                                    }}
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* ORDER BOOK ACCORDION */}
                        <Box sx={{ borderRadius: 1.5, mb: 2, padding: 0 }}>
                            <Accordion
                                sx={{
                                    backgroundColor: theme.palette.surface[1],
                                    border: `1px solid ${theme.palette.border.soft}`,
                                    borderRadius: "12px !important",
                                    overflow: "hidden",
                                    "&:before": { display: "none" },
                                }}
                                expanded={orderBookExpanded}
                                onChange={() => setOrderBookExpanded((e) => !e)}
                                elevation={0}
                            >
                                <AccordionSummary
                                    sx={{
                                        minHeight: 52,
                                        borderBottom: orderBookExpanded ? `1px solid ${theme.palette.border.soft}` : 0,
                                        "& .MuiAccordionSummary-content": { my: 1.25 },
                                    }}
                                    expandIcon={
                                        orderBookExpanded
                                            ? <KeyboardArrowUpIcon sx={{ color: theme.palette.primary.main }} />
                                            : <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
                                    }
                                >
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <MonetizationOnIcon sx={{ color: theme.palette.primary.main, width: 20 }} />
                                        <Typography variant="body2"
                                                    sx={{ color: theme.palette.primary.main, fontWeight: 900 }}>
                                            {t("eventDetails.orderBook")}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
                                    {optionChanceTexts && (
                                        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                                            {[0, 1].map((option) => (
                                                <Box
                                                    key={option}
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        borderRadius: 1,
                                                        border: `1px solid ${alpha(optionColor(option).main, 0.28)}`,
                                                        bgcolor: alpha(optionColor(option).main, theme.palette.mode === "dark" ? 0.1 : 0.06),
                                                        px: 1,
                                                        py: 0.75,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            color: optionColor(option).main,
                                                            fontSize: { xs: "1.1rem", sm: "1.35rem" },
                                                            fontWeight: 800,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        {optionChanceTexts[option]}
                                                    </Typography>
                                                    <Typography
                                                        noWrap
                                                        sx={{
                                                            color: optionColor(option).main,
                                                            fontSize: "0.78rem",
                                                            fontWeight: 700,
                                                            mt: 0.4,
                                                            opacity: 0.9,
                                                        }}
                                                    >
                                                        {option === 0
                                                            ? event?.option0Desc || t("eventDetails.option0")
                                                            : event?.option1Desc || t("eventDetails.option1")}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                    <Tabs value={obTab} onChange={(_, v) => setObTab(v)}
                                          sx={{ mb: 1, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 }, "& .MuiTabs-indicator": { height: 3, borderRadius: 1.5 } }}>
                                        <Tab label={event?.option0Desc || t("eventDetails.option0")} value={0} sx={optionTabSx(0)} />
                                        <Tab label={event?.option1Desc || t("eventDetails.option1")} value={1} sx={optionTabSx(1)} />
                                    </Tabs>

                                    {obLoading && <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>{t("eventDetails.loadingOrderBook")}</Typography>}
                                    {obError && <Typography variant="body2" color="error" sx={{ py: 1 }}>{obError}</Typography>}

                                    {!obLoading && !obError && (
                                        renderOrderBookPanel()
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </Box>

                        {/* AI CONTEXT ACCORDION */}
                        {event?.AIcontext && (
                            <Box sx={{ borderRadius: 1.5, mb: 2, padding: 0 }}>
                                <Accordion sx={{
                                    backgroundColor: theme.palette.surface[1],
                                    border: `1px solid ${theme.palette.border.soft}`,
                                    borderRadius: "12px !important",
                                    overflow: "hidden",
                                    "&:before": { display: "none" },
                                }}
                                           expanded={aiContextExpanded} onChange={() => setAiContextExpanded((e) => !e)} elevation={0}>
                                    <AccordionSummary
                                        sx={{
                                            minHeight: 52,
                                            borderBottom: aiContextExpanded ? `1px solid ${theme.palette.border.soft}` : 0,
                                            "& .MuiAccordionSummary-content": { my: 1.25 },
                                        }}
                                        expandIcon={aiContextExpanded
                                            ? <KeyboardArrowUpIcon sx={{ color: theme.palette.primary.main }} />
                                            : <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
                                        }>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <InsightsIcon sx={{ color: theme.palette.primary.main, width: 20 }} />
                                            <Typography variant="body2"
                                                        sx={{ color: theme.palette.primary.main, fontWeight: 900 }}>
                                                {t("eventDetails.aiContext")}
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                            {event.AIcontext}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )}

                        {/* MORE DETAILS ACCORDION */}
                        <Box sx={{ borderRadius: 1.5, mb: 3, padding: 0 }}>
                            <Accordion sx={{
                                backgroundColor: theme.palette.surface[1],
                                border: `1px solid ${theme.palette.border.soft}`,
                                borderRadius: "12px !important",
                                overflow: "hidden",
                                "&:before": { display: "none" },
                            }}
                                       expanded={detailsExpanded} onChange={() => setDetailsExpanded((e) => !e)} elevation={0}>
                                <AccordionSummary
                                    sx={{
                                        minHeight: 52,
                                        borderBottom: detailsExpanded ? `1px solid ${theme.palette.border.soft}` : 0,
                                        "& .MuiAccordionSummary-content": { my: 1.25 },
                                    }}
                                    expandIcon={detailsExpanded
                                        ? <KeyboardArrowUpIcon sx={{ color: theme.palette.primary.main }} />
                                        : <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
                                    }>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <InfoIcon sx={{ color: theme.palette.primary.main, width: 20 }} />
                                        <Typography variant="body2"
                                                    sx={{ color: theme.palette.primary.main, fontWeight: 900 }}>
                                            {t("eventDetails.moreDetails")}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: { xs: 1.5, sm: 2 } }}>
                                    <Grid container spacing={2}>
                                        {[
                                            { icon: EventAvailableIcon, label: t("eventDetails.open"), value: event.openDate, color: theme.palette.primary.main },
                                            { icon: TimelineIcon, label: t("eventDetails.end"), value: event.endDate, color: timerColor },
                                        ].map((item, idx) => (
                                            <Grid item xs={12} md={6} key={idx}>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <item.icon sx={{ color: item.color }} />
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                                        <Typography variant="body2" sx={{ color: item.color, fontWeight: 600 }}>{item.value}</Typography>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {event.disputerId && (
                                        <Box mt={2}>
                                            <Typography variant="body2" color="text.secondary">
                                                {t("eventDetails.disputer", { identity: event.disputerId, amount: event.disputeAmount })}
                                            </Typography>
                                            {(event.computorsVote0 > 0 || event.computorsVote1 > 0) && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {t("eventDetails.votes", { no: event.computorsVote0, yes: event.computorsVote1 })}
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
                                                {t("eventDetails.dispute")}
                                            </Button>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                {t("eventDetails.disputeHint")}
                                            </Typography>
                                        </Box>
                                    )}
                                    <EventRules event={event} />
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    </Grid>

                    {/* TRADING BOX (right side) */}
                    <Grid item xs={12} md={4}>
                        <Box
                            sx={{
                                width: "100%",
                                borderRadius: 1.5,
                                bgcolor: theme.palette.surface[1],
                                border: `1px solid ${theme.palette.border.default}`,
                                boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
                                p: { xs: 1.5, sm: 2 },
                                position: "sticky",
                                top: theme.spacing(10),
                            }}
                        >
                            <Stack spacing={2}>
                                <Box>
                                    <Typography
                                        sx={{
                                            color: "primary.main",
                                            fontSize: "0.72rem",
                                            fontWeight: 900,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            mb: 0.5,
                                        }}
                                    >
                                        {t("eventDetails.tradePanel")}
                                    </Typography>
                                    <Typography sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                                        {t("eventDetails.tradeDescription")}
                                    </Typography>
                                </Box>

                                {/* Buy / Sell tabs */}
                                <Tabs value={tradeSide} onChange={(_, v) => v && setTradeSide(v)}
                                      variant="fullWidth"
                                      sx={{
                                          minHeight: 30,
                                          p: 0.35,
                                          borderRadius: 1.25,
                                          border: `1px solid ${theme.palette.border.soft}`,
                                          bgcolor: theme.palette.surface[2],
                                          "& .MuiTab-root": { minHeight: 34, textTransform: "none", fontWeight: 900, fontSize: 13, py: 0.25, borderRadius: 1 },
                                          "& .MuiTabs-indicator": {
                                              display: "none",
                                          },
                                      }}>
                                    <Tab label={t("eventDetails.buy")} value="buy" sx={tradeSideTabSx("buy")} />
                                    <Tab label={t("eventDetails.sell")} value="sell" sx={tradeSideTabSx("sell")} />
                                </Tabs>

                                {/* Option selector */}
                                <ToggleButtonGroup value={selectedOption} exclusive
                                                   onChange={(_, v) => {
                                                       if (typeof v !== "number") return;
                                                       setSelectedOption(v);
                                                       setObTab(v);
                                                   }}
                                                   size="small" fullWidth
                                                   sx={{
                                                       gap: 1,
                                                       "& .MuiToggleButtonGroup-grouped": {
                                                           borderRadius: "8px !important",
                                                           border: `1px solid ${theme.palette.border.soft} !important`,
                                                       },
                                                   }}>
                                    <ToggleButton value={0} sx={optionToggleSx(0)}>{event?.option0Desc || t("eventDetails.option0")}</ToggleButton>
                                    <ToggleButton value={1} sx={optionToggleSx(1)}>{event?.option1Desc || t("eventDetails.option1")}</ToggleButton>
                                </ToggleButtonGroup>

                                <TradeAmountSlider
                                    label={t("eventDetails.shares")}
                                    value={tradeAmountInput}
                                    max={maxTradeAmount}
                                    unit={t("eventDetails.shareUnit")}
                                    availableValue={tradeSide === "buy" ? Number(balance || 0) : availableTradeShares}
                                    availableUnit={tradeSide === "buy" ? "GARTH" : t("eventDetails.shareUnit")}
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
                                    <Typography variant="body2" color="text.secondary">{t("eventDetails.cost")}</Typography>
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography className="amount" variant="body2" sx={{ fontWeight: 900 }}>{formatQubicAmount(tradeCoins)}</Typography>
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
                                        disabled={tradeSubmitDisabled}
                                        sx={{ minHeight: 44, fontWeight: 900 }}>
                                    {submitting
                                        ? t("eventDetails.signing")
                                        : (tradeSide === "buy" ? t("eventDetails.placeBuy") : t("eventDetails.placeSell"))}
                                </Button>

                                {/* Matching info hint */}
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", lineHeight: 1.3 }}>
                                    {tradeSide === "buy"
                                        ? t("eventDetails.mintHint", { price: formatQubicAmount(WHOLE_SHARE_PRICE - tradePrice) })
                                        : t("eventDetails.sellHint")
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
        </PageShell>
    );
}

export default EventDetailsPage;
