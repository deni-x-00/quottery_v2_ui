import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { useBalanceNotifier } from "../hooks/useBalanceNotifier";
import usePageTitle from "../hooks/usePageTitle";
import { useIndexerStatus, usePortfolio } from "../hooks/data";
import { useTxTracker } from "../hooks/useTxTracker";
import { broadcastTransaction, getBasicInfo } from "../components/qubic/util/bobApi";
import { byteArrayToHexString } from "../components/qubic/util";
import {
  buildQuotteryTx,
  packEventIdPayload,
  packOrderPayload,
  QTRY_REMOVE_ASK_ORDER,
  QTRY_REMOVE_BID_ORDER,
  QTRY_USER_CLAIM_REWARD,
} from "../components/qubic/util/quotteryTx";
import { explorerTickOrTxLabel, explorerTickOrTxUrl, shortExplorerTickOrTxLabel } from "../utils/explorerLinks";
import {
  formatAmount,
  formatDateUtc,
  formatPrice,
  formatPriceWithPercent,
  formatSignedAmount,
  formatSignedPercent,
  normalizeIdentity,
  shortMiddle,
} from "../utils/format";
import { ActionIconButton, DataTable, LoadingSkeleton, MetricGrid, PageHeader, PageShell } from "../components/ui";

const IDENTITY_RE = /^[A-Z]{56,60}$/;
const MAIN_TABS = {
  POSITIONS: "positions",
  ORDERS: "orders",
  TRANSFERS: "transfers",
};
const SUB_TABS = {
  ACTIVE: "active",
  CLOSED: "closed",
};
const PAGE_SIZE = 50;
const CLAIM_REWARD_QUBIC_FEE = 1000000;
const WHOLE_SHARE_PRICE = 100000;
const PENDING_CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const ORDER_STATUS_META = {
  open: { label: "Open", color: "open" },
  partially_matched: { label: "Partially matched", color: "closed" },
  pending: { label: "Pending", color: "open" },
  matched: { label: "Matched", color: "resolved" },
  missing_matched: { label: "Matched", color: "resolved" },
  removed_by_user: { label: "Canceled", color: "closed" },
  removed_by_system: { label: "Returned", color: "open" },
};

const isValidIdentity = (identity) => IDENTITY_RE.test(identity);

function integerString(value, fallback = "0") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replace(/,/g, "").split(".")[0] || fallback;
}

function pendingClaimsStorageKey(identity) {
  return `quottery:pending-claims:${normalizeIdentity(identity)}`;
}

function readPendingClaimIds(identity) {
  if (!identity || typeof window === "undefined") return [];
  try {
    const now = Date.now();
    const parsed = JSON.parse(window.localStorage.getItem(pendingClaimsStorageKey(identity)) || "[]");
    return (Array.isArray(parsed) ? parsed : [])
      .filter((item) => item?.eventId && now - Number(item.at || 0) < PENDING_CLAIM_TTL_MS)
      .map((item) => String(item.eventId));
  } catch {
    return [];
  }
}

function writePendingClaimIds(identity, eventIds) {
  if (!identity || typeof window === "undefined") return;
  const uniqueIds = [...new Set((eventIds || []).map((eventId) => String(eventId)).filter(Boolean))];
  const now = Date.now();
  try {
    window.localStorage.setItem(
      pendingClaimsStorageKey(identity),
      JSON.stringify(uniqueIds.map((eventId) => ({ eventId, at: now })))
    );
  } catch {
    // localStorage is best-effort only.
  }
}

function optionLabel(row) {
  if (row.option === null || row.option === undefined) return "-";
  if (Number(row.option) === 0) return row.option0 || "Yes";
  if (Number(row.option) === 1) return row.option1 || "No";
  return `Option ${row.option}`;
}

const shortLinkText = shortMiddle;

function statusColor(status) {
  if (status === "open" || status === "pending") return "info";
  if (status === "matched" || status === "win") return "success";
  if (status === "lose") return "error";
  if (status === "removed_by_user" || status === "removed_by_system") return "warning";
  if (status === "partially_matched") return "secondary";
  return "default";
}

function isActiveOrder(row) {
  return (row.status === "open" || row.status === "partially_matched")
    && !["finalized", "archived"].includes(row.event_status);
}

function isClosedOrderEvent(row) {
  return ["matched", "missing_matched", "removed_by_user", "removed_by_system"].includes(row.action);
}

function orderEventStatus(row) {
  if (row.action === "missing_matched") return "matched";
  return row.action || row.status || "-";
}

function orderEventToClosedOrder(row) {
  return {
    ...row,
    status: orderEventStatus(row),
    original_amount: row.amount,
    open_amount: 0,
    order_uid: row.order_uid || row.order_event_uid,
  };
}

function isActivePosition(row) {
  return row.status === "pending" && (Number(row.amount || 0) > 0 || Number(row.locked_amount || 0) > 0);
}

function payoutForPosition(position, payouts) {
  const eventResult = position?.result;
  if (eventResult !== null && eventResult !== undefined && Number(position.option) !== Number(eventResult)) {
    return { amount: 0, estimated: false };
  }

  const actualPayout = Number(position?.actual_payout || 0) || (payouts || [])
    .filter((payout) => Number(payout.event_id) === Number(position.event_id))
    .filter((payout) => payout.result === null || payout.result === undefined || Number(position.option) === Number(payout.result))
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  if (actualPayout > 0) return { amount: actualPayout, estimated: false };

  if (position?.status === "win") {
    const amount = Number(position?.amount || 0);
    const payoutPerShare = Number(position?.win_payout_per_share || 0);
    if (amount > 0 && payoutPerShare > 0) return { amount: amount * payoutPerShare, estimated: true };
  }

  return { amount: 0, estimated: false };
}

function positionInvestedAmount(position) {
  const amount = Number(position?.amount || 0);
  const avgPrice = Number(position?.avg_entry_price || 0);
  const tradeCost = Number(position?.realized_trade_cost || 0);
  const settlementCost = ["win", "lose"].includes(position?.status) && Number.isFinite(amount) && Number.isFinite(avgPrice) && amount > 0 && avgPrice > 0
    ? amount * avgPrice
    : 0;
  const totalCost = (Number.isFinite(tradeCost) ? tradeCost : 0) + settlementCost;
  return totalCost > 0 ? totalCost : null;
}

function positionPnlPercent(position) {
  const invested = positionInvestedAmount(position);
  if (!invested) return null;
  return (Number(position?.realized_pnl || 0) / invested) * 100;
}

function rowSortTick(row) {
  const candidates = [
    row?.tick,
    row?.closed_tick,
    row?.updated_tick,
    row?.created_tick,
    row?.last_seen_tick,
    row?.event_tick,
  ];
  for (const candidate of candidates) {
    const tick = Number(candidate || 0);
    if (Number.isFinite(tick) && tick > 0) return tick;
  }
  return 0;
}

function rowSortTime(row) {
  const candidates = [
    row?.tx_timestamp,
    row?.closed_tx_timestamp,
    row?.updated_at,
    row?.created_tx_timestamp,
    row?.created_at,
  ];
  for (const candidate of candidates) {
    const time = Date.parse(candidate || "");
    if (Number.isFinite(time)) return time;
  }
  return 0;
}

function newestRows(rows) {
  return [...(rows || [])].sort((a, b) => (
    rowSortTick(b) - rowSortTick(a)
    || rowSortTime(b) - rowSortTime(a)
    || Number(b?.event_id || 0) - Number(a?.event_id || 0)
  ));
}

function groupByEvent(rows) {
  const groups = [];
  const byId = new Map();
  for (const row of rows || []) {
    const id = String(row.event_id ?? "unknown");
    if (!byId.has(id)) {
      const group = {
        eventId: row.event_id,
        description: row.description || `Event #${row.event_id}`,
        rows: [],
      };
      byId.set(id, group);
      groups.push(group);
    }
    byId.get(id).rows.push(row);
  }
  return groups;
}

function flattenEventGroups(rows) {
  return groupByEvent(rows).flatMap((group) =>
    group.rows.map((row, index) => ({
      ...row,
      description: group.description,
      __showEvent: index === 0,
      __groupStart: index === 0,
    }))
  );
}

const ProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { identity: routeIdentity } = useParams();
  const { connected, toggleConnectModal, getSignedTx } = useQubicConnect();
  const { bobUrl } = useConfig();
  const { showSnackbar } = useSnackbar();
  const { scheduleBalanceRefresh } = useBalanceNotifier();
  const { trackTx } = useTxTracker();
  const { walletPublicIdentity, walletPublicKeyBytes, getScheduledTick, quBalance } = useQuotteryContext();

  const activeIdentity = useMemo(
    () => normalizeIdentity(routeIdentity || walletPublicIdentity),
    [routeIdentity, walletPublicIdentity]
  );
  usePageTitle(activeIdentity ? `${shortLinkText(activeIdentity)} portfolio` : "Portfolio");

  const [tab, setTab] = useState(MAIN_TABS.POSITIONS);
  const [subTab, setSubTab] = useState(SUB_TABS.ACTIVE);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [page, setPage] = useState(1);
  const [cancellingOrderUid, setCancellingOrderUid] = useState("");
  const [claimingEventId, setClaimingEventId] = useState("");
  const [pendingClaimEventIds, setPendingClaimEventIds] = useState([]);
  const {
    data: profile,
    loading,
    error,
    refetch: loadProfile,
  } = usePortfolio(activeIdentity, { validateIdentity: isValidIdentity });
  const { indexerStatus, liveTick } = useIndexerStatus();

  useEffect(() => {
    setTab(MAIN_TABS.POSITIONS);
    setSubTab(SUB_TABS.ACTIVE);
    setPage(1);
    setPendingClaimEventIds(readPendingClaimIds(activeIdentity));
  }, [activeIdentity]);

  useEffect(() => {
    if (!activeIdentity || !profile?.positions) return;

    const actualClaimedIds = new Set(
      profile.positions
        .filter((position) => Number(position.actual_payout || 0) > 0)
        .map((position) => String(position.event_id))
    );
    if (actualClaimedIds.size === 0) return;

    setPendingClaimEventIds((currentIds) => {
      const nextIds = currentIds.filter((eventId) => !actualClaimedIds.has(String(eventId)));
      if (nextIds.length !== currentIds.length) writePendingClaimIds(activeIdentity, nextIds);
      return nextIds;
    });
  }, [activeIdentity, profile?.positions]);

  const clearPendingClaimEventId = useCallback((eventId) => {
    if (!activeIdentity || eventId === null || eventId === undefined) return;
    setPendingClaimEventIds((currentIds) => {
      const nextIds = currentIds.filter((currentId) => String(currentId) !== String(eventId));
      if (nextIds.length !== currentIds.length) writePendingClaimIds(activeIdentity, nextIds);
      return nextIds;
    });
  }, [activeIdentity]);

  const copyActiveIdentity = useCallback(async () => {
    if (!activeIdentity) return;
    try {
      await navigator.clipboard.writeText(activeIdentity);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 1400);
    } catch (err) {
      setCopiedAddress(false);
    }
  }, [activeIdentity]);

  const account = profile?.account;
  const isOwnProfile = activeIdentity && walletPublicIdentity && activeIdentity === normalizeIdentity(walletPublicIdentity);
  const claimReward = useCallback(async (row) => {
    if (claimingEventId) return;
    if (!connected) {
      toggleConnectModal();
      return;
    }
    if (!isOwnProfile) {
      showSnackbar("Connect the wallet that owns this position.", "error");
      return;
    }
    if (!walletPublicKeyBytes) {
      showSnackbar("Wallet public key not found.", "error");
      return;
    }
    if (!getSignedTx || !getScheduledTick || !bobUrl) {
      showSnackbar("Wallet or network connection is not ready.", "error");
      return;
    }
    if (quBalance !== null && quBalance !== undefined && Number(quBalance) < CLAIM_REWARD_QUBIC_FEE) {
      showSnackbar(`Claim requires ${formatAmount(CLAIM_REWARD_QUBIC_FEE)} QU deposit.`, "error");
      return;
    }

    const eventId = Number(row.event_id);
    if (!Number.isInteger(eventId) || eventId < 0) {
      showSnackbar("Invalid event ID.", "error");
      return;
    }

    setClaimingEventId(String(eventId));
    try {
      const tickInfo = await getScheduledTick();
      if (!tickInfo) throw new Error("Failed to get current tick from network.");

      const payload = packEventIdPayload(eventId);
      const packet = buildQuotteryTx(
        walletPublicKeyBytes,
        tickInfo.scheduledTick,
        QTRY_USER_CLAIM_REWARD,
        CLAIM_REWARD_QUBIC_FEE,
        payload
      );

      showSnackbar("Sign claim transaction in wallet.", "info");
      const confirmed = await getSignedTx(packet);
      if (!confirmed) return;

      const txHex = typeof confirmed.tx === "string"
        ? confirmed.tx
        : byteArrayToHexString(confirmed.tx);
      const res = await broadcastTransaction(bobUrl, txHex);
      if (!res || res.error) throw new Error(res?.error || "Transaction broadcast failed");

      trackTx({
        txHash: res.txHash,
        scheduledTick: tickInfo.scheduledTick,
        description: `Claim reward for ${row.description || `event ${eventId}`}`,
        inputType: QTRY_USER_CLAIM_REWARD,
        eventId,
        txAmount: CLAIM_REWARD_QUBIC_FEE,
        onFailure: () => clearPendingClaimEventId(eventId),
      });
      setPendingClaimEventIds((currentIds) => {
        const nextIds = [...new Set([...currentIds, String(eventId)])];
        writePendingClaimIds(activeIdentity, nextIds);
        return nextIds;
      });
      scheduleBalanceRefresh(2000);
      window.setTimeout(loadProfile, 5000);
    } catch (err) {
      showSnackbar(`Claim failed: ${err.message || err}`, "error");
    } finally {
      setClaimingEventId("");
    }
  }, [
    activeIdentity,
    bobUrl,
    claimingEventId,
    clearPendingClaimEventId,
    connected,
    getScheduledTick,
    getSignedTx,
    isOwnProfile,
    loadProfile,
    quBalance,
    scheduleBalanceRefresh,
    showSnackbar,
    toggleConnectModal,
    trackTx,
    walletPublicKeyBytes,
  ]);

  const cancelOrder = useCallback(async (row) => {
    if (cancellingOrderUid) return;
    if (!connected) {
      toggleConnectModal();
      return;
    }
    if (!isOwnProfile) {
      showSnackbar("Connect the wallet that owns this order.", "error");
      return;
    }
    if (!walletPublicKeyBytes) {
      showSnackbar("Wallet public key not found.", "error");
      return;
    }
    if (!getSignedTx || !getScheduledTick || !bobUrl) {
      showSnackbar("Wallet or network connection is not ready.", "error");
      return;
    }

    const eventId = integerString(row.event_id);
    const option = integerString(row.option);
    const amount = integerString(row.open_amount || row.original_amount);
    const price = integerString(row.price);
    if (amount === "0") {
      showSnackbar("This order has no open amount to cancel.", "warning");
      return;
    }

    setCancellingOrderUid(row.order_uid || `${eventId}:${option}:${row.side}:${price}`);
    try {
      const [tickInfo, basicInfo] = await Promise.all([
        getScheduledTick(),
        getBasicInfo(bobUrl),
      ]);
      if (!tickInfo) throw new Error("Failed to get current tick from network.");
      if (!basicInfo) throw new Error("Failed to get contract info.");

      const inputType = row.side === "bid" ? QTRY_REMOVE_BID_ORDER : QTRY_REMOVE_ASK_ORDER;
      const antiSpamAmount = basicInfo.antiSpamAmount || 0;
      const payload = packOrderPayload(eventId, option, amount, price);
      const packet = buildQuotteryTx(
        walletPublicKeyBytes,
        tickInfo.scheduledTick,
        inputType,
        antiSpamAmount,
        payload
      );

      showSnackbar("Sign cancellation transaction in wallet.", "info");
      const confirmed = await getSignedTx(packet);
      if (!confirmed) return;

      const txHex = typeof confirmed.tx === "string"
        ? confirmed.tx
        : byteArrayToHexString(confirmed.tx);
      const res = await broadcastTransaction(bobUrl, txHex);
      if (!res || res.error) throw new Error(res?.error || "Transaction broadcast failed");

      trackTx({
        txHash: res.txHash,
        scheduledTick: tickInfo.scheduledTick,
        description: `Cancel ${row.side === "bid" ? "buy" : "sell"} ${formatAmount(amount)} ${optionLabel(row)} @ ${formatPrice(price)}`,
        inputType,
        type: "order",
        action: "remove",
        eventId,
        option,
        side: row.side === "bid" ? "buy" : "sell",
        amount,
        price,
      });
      scheduleBalanceRefresh(2000);
      window.setTimeout(loadProfile, 5000);
    } catch (err) {
      showSnackbar(`Failed to cancel order: ${err.message || err}`, "error");
    } finally {
      setCancellingOrderUid("");
    }
  }, [
    bobUrl,
    cancellingOrderUid,
    connected,
    getScheduledTick,
    getSignedTx,
    isOwnProfile,
    loadProfile,
    scheduleBalanceRefresh,
    showSnackbar,
    toggleConnectModal,
    trackTx,
    walletPublicKeyBytes,
  ]);
  const panelSx = {
    p: { xs: 1.5, sm: 2 },
    borderRadius: 1.5,
    border: `1px solid ${theme.palette.border.soft}`,
    bgcolor: theme.palette.surface[1],
    boxShadow: "none",
  };
  const renderEventLink = (row) => (
    <Button
      size="small"
      variant="text"
      component="a"
      href={`/market/${row.event_id}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(`/market/${row.event_id}`, { state: { from: `/portfolio/${activeIdentity}` } });
      }}
      sx={{
        minWidth: 0,
        px: 0,
        textTransform: "none",
        fontWeight: 700,
        justifyContent: "flex-start",
        textAlign: "left",
        color: theme.palette.primary.main,
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
      }}
    >
      <Box component="span" sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
        {row.description || String(row.event_id || "-")}
      </Box>
    </Button>
  );
  const renderArchivedEventLink = (row) => (
    <Button
      size="small"
      variant="text"
      component="a"
      href={`/markets?view=archive&q=${encodeURIComponent(row.event_id || row.description || "")}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(`/markets?view=archive&q=${encodeURIComponent(row.event_id || row.description || "")}`, { state: { from: `/portfolio/${activeIdentity}` } });
      }}
      sx={{
        minWidth: 0,
        px: 0,
        textTransform: "none",
        fontWeight: 700,
        justifyContent: "flex-start",
        textAlign: "left",
        color: theme.palette.primary.main,
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
      }}
    >
      <Box component="span" sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
        {row.description || String(row.event_id || "-")}
      </Box>
    </Button>
  );
  const renderGroupedEventLink = (row) => (
    row.__showEvent ? renderEventLink(row) : <Box component="span" sx={{ display: "block", minHeight: 24 }} />
  );
  const renderResolvedEventLink = (row) => (
    row?.event_status === "archived" ? renderArchivedEventLink(row) : renderEventLink(row)
  );
  const renderGroupedResolvedEventLink = (row) => (
    row.__showEvent ? renderResolvedEventLink(row) : <Box component="span" sx={{ display: "block", minHeight: 24 }} />
  );
  const possiblePositionProfit = (row) => {
    const amount = Number(row.amount || 0);
    const avgPrice = Number(row.avg_entry_price || 0);
    if (!Number.isFinite(amount) || !Number.isFinite(avgPrice)) return "-";
    return formatAmount(amount * Math.max(WHOLE_SHARE_PRICE - avgPrice, 0));
  };
  const renderPnl = (value, percent = null) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value || 0);
    const color = num > 0 ? theme.palette.success.main : num < 0 ? theme.palette.error.main : "text.secondary";
    const resolvedColor = color === "text.secondary" ? theme.palette.text.secondary : color;
    const percentText = formatSignedPercent(percent);
    return (
      <Typography
        component="span"
        sx={{
          color,
          fontWeight: 760,
          fontSize: "0.88rem",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 0,
        }}
      >
        {formatSignedAmount(value)}
        {percentText && (
          <Box component="span" sx={{ ml: 0.5, color: alpha(resolvedColor, 0.82), fontWeight: 650 }}>
            ({percentText})
          </Box>
        )}
      </Typography>
    );
  };
  const pnlTone = (value) => {
    const num = Number(value || 0);
    if (num > 0) return "yes";
    if (num < 0) return "no";
    return "muted";
  };
  const renderStatus = (status) => {
    if (status === "win" || status === "lose") {
      const isWin = status === "win";
      const color = isWin ? theme.palette.success.main : theme.palette.error.main;
      const Icon = isWin ? CheckCircleIcon : CancelIcon;
      return (
        <Stack direction="row" spacing={0.55} alignItems="center" justifyContent="center" sx={{ color }}>
          <Icon sx={{ fontSize: 16 }} />
          <Typography component="span" sx={{ color, fontWeight: 720, fontSize: "0.88rem", letterSpacing: 0 }}>
            {isWin ? "Win" : "Lose"}
          </Typography>
        </Stack>
      );
    }

    if (ORDER_STATUS_META[status]) {
      const meta = ORDER_STATUS_META[status];
      const color = theme.palette.status?.[meta.color] || theme.palette.text.secondary;
      return (
        <Chip
          size="small"
          label={meta.label}
          variant="outlined"
          sx={{
            height: 25,
            color,
            bgcolor: alpha(color, theme.palette.mode === "light" ? 0.12 : 0.1),
            borderColor: alpha(color, theme.palette.mode === "light" ? 0.42 : 0.35),
            fontWeight: 720,
            letterSpacing: 0,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      );
    }

    return <Chip size="small" label={status || "-"} color={statusColor(status)} variant="outlined" />;
  };
  const renderTickStat = (tick, tickRef = null) => {
    if (!tick) return "-";
    const explorerRef = tickRef || tick;
    return (
      <Button
        size="small"
        variant="text"
        component="a"
        href={explorerTickOrTxUrl(explorerRef)}
        target="_blank"
        rel="noreferrer"
        sx={{
          minWidth: 0,
          p: 0,
          textTransform: "none",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          verticalAlign: "baseline",
          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
        }}
      >
        {shortExplorerTickOrTxLabel(explorerRef, formatAmount)}
      </Button>
    );
  };
  const indexedTick = Number(indexerStatus?.lastIndexedTick || 0) || null;
  const indexerLag = indexedTick && liveTick ? Math.max(liveTick - indexedTick, 0) : null;
  const indexerIsBehind = Number.isFinite(indexerLag) && indexerLag > 100;

  const orderColumns = [
    { key: "description", label: "Event", minWidth: 340, wrap: true, render: renderGroupedEventLink },
    {
      key: "status",
      label: "Status",
      minWidth: 96,
      render: (row) => renderStatus(row.status),
    },
    { key: "option", label: "Option", minWidth: 92, render: optionLabel },
    { key: "side", label: "Side", minWidth: 64, render: (row) => row.side || "-" },
    {
      key: "amount",
      label: "Amount",
      render: (row) => formatAmount(isActiveOrder(row) ? row.open_amount : row.original_amount),
    },
    { key: "price", label: "Price", minWidth: 116, render: (row) => formatPriceWithPercent(row.price) },
  ];

  const activeOrderColumns = [
    ...orderColumns,
    {
      key: "action",
      label: "",
      minWidth: 88,
      render: (row) => {
        if (!isOwnProfile) return <Box component="span" sx={{ display: "block", minHeight: 24 }} />;
        const isCancelling = cancellingOrderUid === row.order_uid;
        return (
          <Tooltip title={connected ? "Cancel order" : "Connect wallet to cancel"}>
            <span>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                disabled={isCancelling}
                onClick={() => cancelOrder(row)}
                sx={{
                  minHeight: 26,
                  px: 1,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 750,
                  fontSize: "0.78rem",
                }}
              >
                {isCancelling ? "..." : "Cancel"}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const closedOrderColumns = [
    { ...orderColumns[0], render: renderGroupedResolvedEventLink },
    ...orderColumns.slice(1),
  ];

  const positionColumns = [
    { key: "description", label: "Event", minWidth: 340, wrap: true, render: renderGroupedEventLink },
    { key: "option", label: "Option", minWidth: 92, render: optionLabel },
    { key: "amount", label: "Amount", render: (row) => formatAmount(row.amount) },
    { key: "avg_entry_price", label: "Avg price", minWidth: 116, render: (row) => formatPriceWithPercent(row.avg_entry_price) },
    { key: "possible_profit", label: "Possible profit", minWidth: 128, render: possiblePositionProfit },
  ];

  const closedPositionBaseColumns = [
    { key: "description", label: "Event", minWidth: 340, wrap: true, render: renderGroupedResolvedEventLink },
    {
      key: "status",
      label: "Status",
      minWidth: 96,
      render: (row) => renderStatus(row.status),
    },
    { key: "option", label: "Option", minWidth: 92, render: optionLabel },
    { key: "amount", label: "Amount", render: (row) => formatAmount(row.amount) },
    { key: "avg_entry_price", label: "Avg price", minWidth: 116, render: (row) => formatPriceWithPercent(row.avg_entry_price) },
  ];

  const closedPositionColumns = [
    ...closedPositionBaseColumns,
    { key: "realized_pnl", label: "PnL", render: (row) => renderPnl(row.realized_pnl, positionPnlPercent(row)) },
    {
      key: "payout",
      label: "Net payout",
      render: (row) => {
        const payout = payoutForPosition(row, profile?.payouts || []);
        if (payout.amount <= 0) return "-";
        return (
          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="baseline">
            <Box component="span">{formatAmount(payout.amount)}</Box>
            {payout.estimated && (
              <Box component="span" sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 650 }}>
                est.
              </Box>
            )}
          </Stack>
        );
      },
    },
    {
      key: "claim",
      label: "",
      minWidth: 86,
      render: (row) => {
        const actualPayout = Number(row.actual_payout || 0);
        const isPendingClaim = pendingClaimEventIds.includes(String(row.event_id));
        const isClaimable = isOwnProfile
          && row.status === "win"
          && actualPayout <= 0
          && !isPendingClaim
          && Number(row.amount || 0) > 0;
        if (isPendingClaim) {
          return (
            <Chip
              size="small"
              label="Pending"
              variant="outlined"
              sx={{
                height: 25,
                color: "text.secondary",
                borderColor: alpha(theme.palette.text.primary, 0.18),
                fontWeight: 700,
              }}
            />
          );
        }
        if (!isClaimable) return <Box component="span" sx={{ display: "block", minHeight: 24 }} />;

        const isClaiming = claimingEventId === String(row.event_id);
        return (
          <Tooltip title={connected ? "Claim reward" : "Connect wallet to claim"}>
            <span>
              <Button
                size="small"
                variant="outlined"
                color="success"
                disabled={isClaiming}
                onClick={() => claimReward(row)}
                sx={{
                  minHeight: 26,
                  px: 1,
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 750,
                  fontSize: "0.78rem",
                }}
              >
                {isClaiming ? "..." : "Claim"}
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const transferColumns = [
    { key: "token", label: "Token", minWidth: 72 },
    { key: "amount", label: "Amount", render: (row) => formatAmount(row.amount) },
    {
      key: "source",
      label: "Source",
      render: (row) => row.source ? (
        <Button size="small" variant="text" onClick={() => navigate(`/portfolio/${row.source}`)} sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 700 }}>
          {shortLinkText(row.source)}
        </Button>
      ) : "-",
    },
    {
      key: "destination",
      label: "Destination",
      render: (row) => row.destination ? (
        <Button size="small" variant="text" onClick={() => navigate(`/portfolio/${row.destination}`)} sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 700 }}>
          {shortLinkText(row.destination)}
        </Button>
      ) : "-",
    },
    {
      key: "tx_hash",
      label: "Hash",
      render: (row) => row.tx_hash ? (
        <Button size="small" variant="text" component="a" href={`https://explorer.qubic.org/network/tx/${row.tx_hash}`} target="_blank" rel="noreferrer" sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 700 }}>
          {shortLinkText(row.tx_hash)}
        </Button>
      ) : "-",
    },
    {
      key: "tick",
      label: "Tick",
      render: (row) => row.tick ? (
        <Button size="small" variant="text" component="a" href={explorerTickOrTxUrl(row.tick_ref || row.tick)} target="_blank" rel="noreferrer" sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 700 }}>
          {explorerTickOrTxLabel(row.tick_ref || row.tick, formatAmount)}
        </Button>
      ) : "-",
    },
    { key: "tx_timestamp", label: "Time", minWidth: 170, render: (row) => formatDateUtc(row.tx_timestamp || row.created_at) },
  ];

  const positions = profile?.positions || [];
  const orders = profile?.orders || [];
  const orderEvents = profile?.orderEvents || [];
  const transfers = profile?.transfers || [];
  const activePositions = newestRows(positions.filter(isActivePosition));
  const closedPositions = newestRows(positions.filter((row) => !isActivePosition(row)));
  const activeOrders = newestRows(orders.filter(isActiveOrder));
  const closedOrders = newestRows(orderEvents.filter(isClosedOrderEvent).map(orderEventToClosedOrder));

  const baseRows = tab === MAIN_TABS.POSITIONS
    ? subTab === SUB_TABS.ACTIVE ? activePositions : closedPositions
    : tab === MAIN_TABS.ORDERS
      ? subTab === SUB_TABS.ACTIVE ? activeOrders : closedOrders
      : transfers;
  const currentRows = tab === MAIN_TABS.TRANSFERS ? baseRows : flattenEventGroups(baseRows);

  const currentColumns = tab === MAIN_TABS.POSITIONS
    ? subTab === SUB_TABS.ACTIVE ? positionColumns : closedPositionColumns
    : tab === MAIN_TABS.ORDERS
      ? subTab === SUB_TABS.ACTIVE ? activeOrderColumns : closedOrderColumns
      : transferColumns;
  const currentMinWidth = tab === MAIN_TABS.POSITIONS
    ? subTab === SUB_TABS.ACTIVE ? 980 : 1040
    : tab === MAIN_TABS.ORDERS
      ? subTab === SUB_TABS.ACTIVE ? 1010 : 920
      : 760;

  const emptyText = tab === MAIN_TABS.POSITIONS
    ? `No ${subTab} positions found.`
    : tab === MAIN_TABS.ORDERS
      ? `No ${subTab} orders found.`
      : "No transfers found.";
  const accountMetricBaseSx = { minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "center" };
  const accountMetrics = [
    {
      label: "PnL",
      value: account?.realized_pnl === null || account?.realized_pnl === undefined ? "-" : formatSignedAmount(account?.realized_pnl),
      secondaryValue: formatSignedPercent(account?.pnl_percent) || undefined,
      tone: pnlTone(account?.realized_pnl),
      align: "center",
      sx: accountMetricBaseSx,
    },
    { label: "Traded volume", value: formatAmount(account?.traded_volume), align: "center", sx: accountMetricBaseSx },
    { label: "Open bid volume", value: formatAmount(account?.open_bid_volume), align: "center", sx: accountMetricBaseSx },
    { label: "Open ask volume", value: formatAmount(account?.open_ask_volume), align: "center", sx: accountMetricBaseSx },
    { label: "Trades", value: formatAmount(account?.trade_count), align: "center", sx: accountMetricBaseSx },
    { label: "Transfers", value: formatAmount(account?.transfer_count), align: "center", sx: accountMetricBaseSx },
    { label: "First seen tick", value: renderTickStat(account?.first_seen_tick, account?.first_seen_tick_ref), align: "center", sx: accountMetricBaseSx },
    { label: "Last seen tick", value: renderTickStat(account?.last_seen_tick, account?.last_seen_tick_ref), align: "center", sx: accountMetricBaseSx },
  ];
  const pageCount = Math.max(1, Math.ceil(currentRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = currentRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [activeIdentity, tab, subTab]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <PageShell>
      <PageHeader
        eyebrow={isOwnProfile ? "Connected wallet" : "Account"}
        title={isOwnProfile ? "My Portfolio" : "Portfolio"}
        icon={<AccountCircleIcon />}
        actions={(
          <ActionIconButton label="Refresh portfolio" tooltip="Refresh" onClick={loadProfile} disabled={loading || !activeIdentity}>
            <RefreshIcon fontSize="small" />
          </ActionIconButton>
        )}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            minWidth: 0,
            mt: 1.35,
            maxWidth: "100%",
            flexWrap: "wrap",
          }}
        >
              <Typography
                color={activeIdentity ? "text.primary" : "text.secondary"}
                sx={{
                  fontFamily: activeIdentity ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : "inherit",
                  fontSize: activeIdentity ? { xs: "0.82rem", sm: "0.95rem", md: "1.02rem" } : "0.9rem",
                  fontWeight: activeIdentity ? 900 : 500,
                  lineHeight: 1.35,
                  letterSpacing: 0,
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  flex: "0 1 auto",
                  minWidth: 0,
                  maxWidth: { xs: "100%", md: "calc(100% - 96px)" },
                }}
              >
                {activeIdentity || "Connect wallet to open your portfolio"}
              </Typography>
              {activeIdentity && (
                <Stack direction="row" spacing={0.65} alignItems="center" sx={{ flexShrink: 0 }}>
                  <ActionIconButton
                      label="Copy address"
                      tooltip={copiedAddress ? "Copied" : "Copy address"}
                      onClick={copyActiveIdentity}
                      size={36}
                  >
                      <ContentCopyIcon sx={{ fontSize: 16 }} />
                  </ActionIconButton>
                  <ActionIconButton
                      label="Open address in explorer"
                      component="a"
                      href={`https://explorer.qubic.org/network/address/${activeIdentity}`}
                      target="_blank"
                      rel="noreferrer"
                      size={36}
                  >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </ActionIconButton>
                </Stack>
              )}
        </Stack>
      </PageHeader>

      {!activeIdentity && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08), border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}` }}>
          Connect your wallet to open your portfolio, or search an identity from the leaderboard.
        </Alert>
      )}

      {activeIdentity && !IDENTITY_RE.test(activeIdentity) && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 1.5 }}>
          Invalid identity format.
        </Alert>
      )}

      {isOwnProfile && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            px: { xs: 1.5, sm: 2 },
            py: 1.35,
            borderRadius: 1.5,
            bgcolor: theme.palette.surface[1],
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 850, color: "text.primary", lineHeight: 1.25 }}>
                Transfers, reward claiming, and wallet tools
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                Utilities contains the actions connected to this portfolio.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/utilities"
              size="small"
              variant="outlined"
              sx={{ borderRadius: 1, minHeight: 34, px: 1.5, textTransform: "none", fontWeight: 900, flexShrink: 0 }}
            >
              Go to Utilities
            </Button>
          </Stack>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...panelSx, mb: 2 }}>
        {loading && !profile ? (
          <LoadingSkeleton variant="stats" columns={8} />
        ) : (
          <Stack spacing={2}>
            <MetricGrid
              metrics={accountMetrics}
              columns={{
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              }}
              gap={1.25}
              compact
            />
            {indexedTick && (
              <Box
                sx={{
                  alignSelf: { xs: "stretch", md: "center" },
                  px: 1.25,
                  py: 0.65,
                  borderRadius: 1.25,
                  border: `1px solid ${indexerIsBehind ? alpha(theme.palette.warning.main, 0.35) : alpha(theme.palette.text.primary, 0.1)}`,
                  bgcolor: indexerIsBehind ? alpha(theme.palette.warning.main, 0.08) : theme.palette.surface[2],
                  color: "text.secondary",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.25 }} alignItems={{ xs: "flex-start", sm: "center" }} flexWrap="wrap">
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Indexed: {renderTickStat(indexedTick)}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Live: {liveTick ? renderTickStat(liveTick) : "-"}
                  </Typography>
                  {Number.isFinite(indexerLag) && (
                    <Typography variant="caption" sx={{ fontWeight: 700, color: indexerIsBehind ? "warning.main" : "text.secondary" }}>
                      Lag: {formatAmount(indexerLag)}
                    </Typography>
                  )}
                  {indexerIsBehind && (
                    <Typography variant="caption" color="text.secondary">
                      Txs after {formatAmount(indexedTick)} will appear after indexing catches up.
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
            {!account && activeIdentity && !loading && (
              <Alert severity="info">
                This identity is not indexed yet.
              </Alert>
            )}
          </Stack>
        )}
      </Paper>

      <Paper elevation={0} sx={panelSx}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1}>
            <Tabs
              value={tab}
              onChange={(event, nextTab) => {
                setTab(nextTab);
                setSubTab(SUB_TABS.ACTIVE);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 42,
                borderBottom: `1px solid ${theme.palette.border.soft}`,
                "& .MuiTab-root": {
                  minHeight: 42,
                  textTransform: "none",
                  fontWeight: 900,
                  fontSize: "1rem",
                  alignItems: "flex-start",
                  px: 2,
                },
              }}
            >
              <Tab value={MAIN_TABS.POSITIONS} label="Positions" />
              <Tab value={MAIN_TABS.ORDERS} label="Orders" />
              <Tab value={MAIN_TABS.TRANSFERS} label="Transfers" />
            </Tabs>
            {loading && <Chip label="Refreshing" size="small" variant="outlined" />}
          </Stack>

          {tab !== MAIN_TABS.TRANSFERS && (
            <Tabs
              value={subTab}
              onChange={(event, nextTab) => setSubTab(nextTab)}
              sx={{
                alignSelf: "flex-start",
                minHeight: 40,
                border: `1px solid ${theme.palette.border.default}`,
                borderRadius: 1.5,
                overflow: "hidden",
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  minHeight: 40,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 900,
                  borderRight: `1px solid ${theme.palette.border.default}`,
                  "&:last-of-type": { borderRight: 0 },
                },
                "& .Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <Tab
                value={SUB_TABS.ACTIVE}
                label={`Active (${tab === MAIN_TABS.POSITIONS ? activePositions.length : activeOrders.length})`}
              />
              <Tab
                value={SUB_TABS.CLOSED}
                label={`Closed (${tab === MAIN_TABS.POSITIONS ? closedPositions.length : closedOrders.length})`}
              />
            </Tabs>
          )}
        </Stack>
        <Divider sx={{ my: 1.5, borderColor: theme.palette.border.soft }} />

        <DataTable
          columns={currentColumns}
          rows={pagedRows}
          emptyText={emptyText}
          minWidth={currentMinWidth}
          getRowKey={(row, index) => row.order_event_uid || row.order_uid || row.trade_uid || row.transfer_uid || `${row.event_id}-${row.option}-${index}`}
        />
        {currentRows.length > PAGE_SIZE && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination
              count={pageCount}
              page={safePage}
              onChange={(event, nextPage) => setPage(nextPage)}
              siblingCount={1}
              boundaryCount={1}
              color="primary"
            />
          </Stack>
        )}
      </Paper>
    </PageShell>
  );
};

export default ProfilePage;
