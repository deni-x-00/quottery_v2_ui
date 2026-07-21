import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import UndoOutlinedIcon from "@mui/icons-material/UndoOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getNotifications } from "../../api/quotteryApi";
import { useQuotteryContext } from "../../contexts/QuotteryContext";
import { useSnackbar } from "../../contexts/SnackbarContext";
import {
  formatAmount,
  formatDateUtc,
  formatPriceWithPercent,
  formatSignedAmount,
} from "../../utils/format";

const READ_STORAGE_PREFIX = "quottery.notifications.read.";
const MAX_STORED_READ_IDS = 500;
const POLL_INTERVAL_MS = 30000;

function readStoredIds(identity) {
  if (!identity || typeof window === "undefined") return new Set();
  try {
    const value = JSON.parse(window.localStorage.getItem(`${READ_STORAGE_PREFIX}${identity}`) || "[]");
    return new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

function hasStoredReadState(identity) {
  if (!identity || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${READ_STORAGE_PREFIX}${identity}`) !== null;
  } catch {
    return false;
  }
}

function storeReadIds(identity, ids) {
  if (!identity || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${READ_STORAGE_PREFIX}${identity}`,
      JSON.stringify(Array.from(ids).slice(-MAX_STORED_READ_IDS))
    );
  } catch {
    // The unread state still works for the current page session.
  }
}

function eventPath(notification) {
  if (!notification?.event_id) return null;
  if (notification.event_status === "archived") {
    return `/markets?view=archive&q=${encodeURIComponent(notification.event_id)}`;
  }
  return `/market/${notification.event_id}`;
}

function notificationMeta(notification, t) {
  const option = Number(notification.option) === 0
    ? (notification.option0 || t("notifications.optionYes"))
    : (notification.option1 || t("notifications.optionNo"));
  const event = notification.description || t("notifications.eventFallback", { id: notification.event_id });
  const amount = formatAmount(notification.amount);

  switch (notification.type) {
    case "position_win":
      return {
        title: t("notifications.positionWin"),
        body: t("notifications.positionResultBody", { event, option, amount, pnl: formatSignedAmount(notification.pnl) }),
        color: "success",
        icon: CheckCircleOutlineIcon,
      };
    case "position_lose":
      return {
        title: t("notifications.positionLose"),
        body: t("notifications.positionResultBody", { event, option, amount, pnl: formatSignedAmount(notification.pnl) }),
        color: "error",
        icon: CancelOutlinedIcon,
      };
    case "order_matched":
      return {
        title: t("notifications.orderMatched"),
        body: t("notifications.orderBody", {
          event,
          option,
          amount,
          price: formatPriceWithPercent(notification.price),
        }),
        color: "success",
        icon: DoneAllIcon,
      };
    case "order_canceled":
      return {
        title: t("notifications.orderCanceled"),
        body: t("notifications.orderBody", {
          event,
          option,
          amount,
          price: formatPriceWithPercent(notification.price),
        }),
        color: "warning",
        icon: ReceiptLongOutlinedIcon,
      };
    case "order_returned":
      return {
        title: t("notifications.orderReturned"),
        body: t("notifications.orderBody", {
          event,
          option,
          amount,
          price: formatPriceWithPercent(notification.price),
        }),
        color: "info",
        icon: UndoOutlinedIcon,
      };
    case "reward_claimed":
      return {
        title: t("notifications.rewardClaimed"),
        body: t("notifications.rewardBody", { event, amount, token: notification.token || "GARTH" }),
        color: "success",
        icon: PaymentsOutlinedIcon,
      };
    default:
      return {
        title: t("notifications.transferReceived"),
        body: t("notifications.transferBody", { amount, token: notification.token || "GARTH" }),
        color: "info",
        icon: MoveToInboxOutlinedIcon,
      };
  }
}

export default function NotificationCenter({ iconButtonSx }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { walletPublicIdentity } = useQuotteryContext();
  const { showSnackbar } = useSnackbar();
  const identity = String(walletPublicIdentity || "").trim().toUpperCase();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => readStoredIds(identity));
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef(new Set());
  const hasReadStateRef = useRef(hasStoredReadState(identity));

  const loadNotifications = useCallback(async (signal) => {
    if (!identity) return;
    setLoading((current) => current || !initializedRef.current);
    try {
      const result = await getNotifications(identity, { limit: 40, signal });
      const next = Array.isArray(result?.notifications) ? result.notifications : [];

      if (!initializedRef.current && !hasReadStateRef.current) {
        const initialReadIds = new Set(next.map((item) => item.notification_id));
        setReadIds(initialReadIds);
        storeReadIds(identity, initialReadIds);
        hasReadStateRef.current = true;
      } else if (initializedRef.current) {
        const fresh = next.filter((item) => !knownIdsRef.current.has(item.notification_id));
        if (fresh.length === 1) {
          showSnackbar(notificationMeta(fresh[0], t).title, fresh[0].type === "position_lose" ? "error" : "info");
        } else if (fresh.length > 1) {
          showSnackbar(t("notifications.newCount", { count: fresh.length }), "info");
        }
      }

      knownIdsRef.current = new Set(next.map((item) => item.notification_id));
      initializedRef.current = true;
      setNotifications(next);
      setFailed(false);
    } catch (error) {
      if (error?.name !== "AbortError") setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [identity, showSnackbar, t]);

  useEffect(() => {
    setAnchorEl(null);
    setNotifications([]);
    setReadIds(readStoredIds(identity));
    initializedRef.current = false;
    knownIdsRef.current = new Set();
    hasReadStateRef.current = hasStoredReadState(identity);
    if (!identity) return undefined;

    const controller = new AbortController();
    loadNotifications(controller.signal);
    const intervalId = window.setInterval(() => loadNotifications(), POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [identity, loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (readIds.has(item.notification_id) ? 0 : 1), 0),
    [notifications, readIds]
  );

  const markRead = useCallback((ids) => {
    setReadIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      storeReadIds(identity, next);
      return next;
    });
  }, [identity]);

  if (!identity) return null;

  return (
    <>
      <Tooltip title={t("notifications.title")} arrow>
        <IconButton
          size="small"
          aria-label={t("notifications.title")}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl) ? "true" : undefined}
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            loadNotifications();
          }}
          sx={iconButtonSx}
        >
          <Badge badgeContent={unreadCount} color="error" max={99} overlap="circular">
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ sx: { p: 0 } }}
        PaperProps={{
          sx: {
            mt: 1,
            width: { xs: "calc(100vw - 16px)", sm: 390 },
            maxWidth: 390,
            maxHeight: "min(620px, calc(100vh - 96px))",
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.border.default}`,
            borderRadius: 1.5,
          },
        }}
      >
        <Box sx={{ minHeight: 54, px: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontWeight: 900 }}>{t("notifications.title")}</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={() => markRead(notifications.map((item) => item.notification_id))}
              sx={{ minWidth: 0, textTransform: "none", fontWeight: 800 }}
            >
              {t("notifications.markAllRead")}
            </Button>
          )}
        </Box>
        <Divider />

        {loading && notifications.length === 0 && (
          <Box sx={{ minHeight: 150, display: "grid", placeItems: "center" }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && failed && notifications.length === 0 && (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">{t("notifications.loadFailed")}</Typography>
            <Button size="small" onClick={() => loadNotifications()} sx={{ mt: 1, textTransform: "none" }}>
              {t("notifications.retry")}
            </Button>
          </Box>
        )}

        {!loading && !failed && notifications.length === 0 && (
          <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
            <NotificationsNoneIcon sx={{ mb: 1, color: "text.disabled" }} />
            <Typography color="text.secondary">{t("notifications.empty")}</Typography>
          </Box>
        )}

        {notifications.map((notification, index) => {
          const meta = notificationMeta(notification, t);
          const Icon = meta.icon;
          const unread = !readIds.has(notification.notification_id);
          const to = eventPath(notification);
          return (
            <React.Fragment key={notification.notification_id}>
              {index > 0 && <Divider />}
              <Box
                component={to ? Link : "button"}
                to={to || undefined}
                type={to ? undefined : "button"}
                onClick={() => {
                  markRead([notification.notification_id]);
                  setAnchorEl(null);
                }}
                sx={{
                  width: "100%",
                  border: 0,
                  p: 1.5,
                  display: "grid",
                  gridTemplateColumns: "34px minmax(0, 1fr) auto",
                  gap: 1,
                  alignItems: "start",
                  color: "text.primary",
                  bgcolor: unread ? alpha(theme.palette.primary.main, 0.07) : "transparent",
                  textAlign: "left",
                  textDecoration: "none",
                  cursor: "pointer",
                  font: "inherit",
                  "&:hover": { bgcolor: theme.palette.surface[2] },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: "grid",
                    placeItems: "center",
                    color: `${meta.color}.main`,
                    bgcolor: alpha(theme.palette[meta.color].main, 0.12),
                  }}
                >
                  <Icon sx={{ fontSize: 19 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.84rem", lineHeight: 1.3, fontWeight: unread ? 900 : 750 }}>
                    {meta.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.3, fontSize: "0.75rem", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {meta.body}
                  </Typography>
                  <Typography color="text.disabled" sx={{ mt: 0.6, fontSize: "0.68rem", fontVariantNumeric: "tabular-nums" }}>
                    {formatDateUtc(notification.occurred_at)}
                  </Typography>
                </Box>
                {unread && <Box sx={{ width: 7, height: 7, mt: 0.7, borderRadius: "50%", bgcolor: "primary.main" }} />}
              </Box>
            </React.Fragment>
          );
        })}
      </Menu>
    </>
  );
}
