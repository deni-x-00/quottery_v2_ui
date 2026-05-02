import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useQubicConnect } from "../components/qubic/connect/QubicConnectContext";
import { useConfig } from "../contexts/ConfigContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { useTxTracker } from "../hooks/useTxTracker";
import { byteArrayToHexString } from "../components/qubic/util";
import {
  broadcastTransaction,
  getBasicInfo,
  getEventInfo,
  getUserPositions,
} from "../components/qubic/util/bobApi";
import {
  buildQuotteryTx,
  packOrderPayload,
  QTRY_REMOVE_BID_ORDER,
  QTRY_REMOVE_ASK_ORDER,
} from "../components/qubic/util/quotteryTx";

const UserOrdersPage = () => {
  const {
    walletPublicIdentity,
    walletPublicKeyBytes,
    getScheduledTick,
    allEvents,
    fetchOpenOrders,
  } = useQuotteryContext();

  const { getSignedTx } = useQubicConnect();
  const { bobUrl } = useConfig();
  const { showSnackbar } = useSnackbar();
  const { trackTx } = useTxTracker();

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Positions state (via GetUserPosition SC function 6)
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState(null);
  const [positionEvents, setPositionEvents] = useState({});

  const getKnownEvent = useCallback(
      (eventId) =>
          (allEvents || []).find((e) => String(e.eid) === String(eventId)) ||
          positionEvents[String(eventId)],
      [allEvents, positionEvents]
  );

  // Helper: resolve event name from active events or position-specific event info.
  const getEventName = useCallback(
      (eventId) => {
        const evt = getKnownEvent(eventId);
        return evt ? evt.desc : `Event #${eventId}`;
      },
      [getKnownEvent]
  );

  const getOptionName = useCallback(
      (eventId, option) => {
        const evt = getKnownEvent(eventId);
        if (!evt) return `Option ${option}`;
        return Number(option) === 0
            ? evt.option0Desc || "Option 0"
            : evt.option1Desc || "Option 1";
      },
      [getKnownEvent]
  );

  // ---- Load positions via GetUserPosition (SC function 6) ----
  const loadPositions = useCallback(async () => {
    if (!walletPublicIdentity) {
      setPositions([]);
      return;
    }

    setPositionsLoading(true);
    setPositionsError(null);

    try {
      const result = await getUserPositions(bobUrl, walletPublicIdentity);
      const nextPositions = result?.positions ?? [];
      setPositions(nextPositions);

      const missingEventIds = [
        ...new Set(
            nextPositions
                .map((pos) => pos.eventId)
                .filter((eventId) => eventId !== undefined && eventId !== null)
                .filter((eventId) => !getKnownEvent(eventId))
        ),
      ];

      if (missingEventIds.length > 0) {
        const fetchedEvents = await Promise.all(
            missingEventIds.map(async (eventId) => {
              try {
                return await getEventInfo(bobUrl, eventId);
              } catch (eventErr) {
                console.warn(`Failed to load event info for position event ${eventId}:`, eventErr);
                return null;
              }
            })
        );

        const eventsById = fetchedEvents.reduce((acc, evt) => {
          if (evt && evt.eid !== undefined && evt.eid !== null) {
            acc[String(evt.eid)] = evt;
          }
          return acc;
        }, {});

        if (Object.keys(eventsById).length > 0) {
          setPositionEvents((prev) => ({ ...prev, ...eventsById }));
        }
      }
    } catch (err) {
      console.error("Failed to load positions:", err);
      setPositionsError("Failed to load positions");
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, [bobUrl, walletPublicIdentity, getKnownEvent]);

  // ---- Load orders: scan order books for current open orders ----
  const loadOrders = useCallback(async () => {
    if (!walletPublicIdentity) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    setOrdersError(null);

    try {
      const result = await fetchOpenOrders(walletPublicIdentity);
      const openOrders = (result?.orders ?? []).map((o) => ({
        ...o,
        event_desc: getEventName(o.market_id),
      }));
      setOrders(openOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrdersError("Failed to load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [walletPublicIdentity, fetchOpenOrders, getEventName]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = async () => {
    await Promise.all([loadPositions(), loadOrders()]);
  };

  const handleDeleteOrder = async (order) => {
    if (!order) return;

    try {
      if (!walletPublicKeyBytes) {
        showSnackbar("Wallet public key not found", "error");
        return;
      }

      const [tickInfo, basicInfo] = await Promise.all([
        getScheduledTick(),
        getBasicInfo(bobUrl),
      ]);

      if (!tickInfo) {
        showSnackbar("Failed to get scheduled tick from network.", "error");
        return;
      }
      if (!basicInfo) {
        showSnackbar("Failed to get contract info.", "error");
        return;
      }

      const { scheduledTick } = tickInfo;
      const antiSpamAmount = basicInfo.antiSpamAmount || 0;
      const inputType = order.isBid
          ? QTRY_REMOVE_BID_ORDER
          : QTRY_REMOVE_ASK_ORDER;

      const payload = packOrderPayload(
          order.market_id,
          order.option,
          order.qty,
          order.price
      );

      const packet = buildQuotteryTx(
          walletPublicKeyBytes,
          scheduledTick,
          inputType,
          antiSpamAmount,
          payload
      );

      showSnackbar("Sign your transaction in wallet.", "info");
      const confirmed = await getSignedTx(packet);
      if (!confirmed) return;

      const txHex =
          typeof confirmed.tx === "string"
              ? confirmed.tx
              : byteArrayToHexString(confirmed.tx);

      const res = await broadcastTransaction(bobUrl, txHex);

      if (res && !res.error) {
        const side = order.isBid ? "Bid" : "Ask";
        const description = `${side} ${order.qty} @ ${order.price} for ${getOptionName(order.market_id, order.option)} of ${getEventName(order.market_id)}`;
        const hashInfo = res.txHash ? `\nTx: ${res.txHash}` : "";
        showSnackbar(
            `Order removal broadcasted for tick ${scheduledTick}. Waiting for execution: ${description}${hashInfo}`,
            "info"
        );
        trackTx({
          txHash: res.txHash,
          scheduledTick,
          description,
          type: "order",
          action: "remove",
          eventId: order.market_id,
          option: order.option,
          side: order.isBid ? "buy" : "sell",
          amount: order.qty,
          price: order.price,
        });
      } else {
        showSnackbar(
            `Failed to remove order: ${res?.error || "Unknown error"}`,
            "error"
        );
      }
    } catch (err) {
      console.error("Delete order error:", err);
      showSnackbar(`Error deleting order: ${err.message}`, "error");
    }
  };

  const hasOrders = orders && orders.length > 0;
  const hasPositions = positions && positions.length > 0;
  const showOrdersInitialLoading = ordersLoading && !hasOrders;
  const showPositionsInitialLoading = positionsLoading && !hasPositions;

  return (
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 10, px: 2, mb: 8 }}>
        {/* Header */}
        <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
        >
          <Typography variant="h4">My Open Orders</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {(ordersLoading || positionsLoading) && (
                <Chip label="Refreshing" size="small" variant="outlined" />
            )}
            <Tooltip title="Refresh">
              <IconButton
                  onClick={handleRefresh}
                  disabled={ordersLoading || positionsLoading}
                  size="small"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Orders table */}
        <Paper elevation={2} sx={{ p: 2, overflowX: "auto", mb: 4 }}>
          {showOrdersInitialLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
          )}

          {!showOrdersInitialLoading && ordersError && (
              <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>
                <Typography>{ordersError}</Typography>
              </Box>
          )}

          {!showOrdersInitialLoading && !ordersError && !walletPublicIdentity && (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography>Connect your wallet to see your orders.</Typography>
              </Box>
          )}

          {!showOrdersInitialLoading &&
              !ordersError &&
              walletPublicIdentity &&
              !hasOrders && (
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    <Typography>No orders found.</Typography>
                  </Box>
              )}

          {!showOrdersInitialLoading && !ordersError && hasOrders && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Option</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order, idx) => (
                      <TableRow key={order.order_id || idx}>
                        <TableCell>
                          {order.event_desc || order.market_id || "-"}
                        </TableCell>
                        <TableCell>
                          {order.option != null
                              ? getOptionName(order.market_id, order.option)
                              : "-"}
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {order.side || "-"}
                        </TableCell>
                        <TableCell align="right">
                          {order.price != null ? order.price : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {order.qty != null ? order.qty : "-"}
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {order.status || "open"}
                        </TableCell>
                        <TableCell align="center">
                          {order.status !== "cancelled" && (
                              <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteOrder(order)}
                                  title="Cancel Order"
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </Paper>

        {/* Positions section — via GetUserPosition (SC function 6) */}
        <Typography variant="h4" gutterBottom>
          My Positions
        </Typography>

        <Paper elevation={2} sx={{ p: 2, overflowX: "auto" }}>
          {showPositionsInitialLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
          )}

          {!showPositionsInitialLoading && positionsError && (
              <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>
                <Typography>{positionsError}</Typography>
              </Box>
          )}

          {!showPositionsInitialLoading && !positionsError && !walletPublicIdentity && (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography>
                  Connect your wallet to see your positions.
                </Typography>
              </Box>
          )}

          {!showPositionsInitialLoading &&
              !positionsError &&
              walletPublicIdentity &&
              !hasPositions && (
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    <Typography>No open positions found.</Typography>
                  </Box>
              )}

          {!showPositionsInitialLoading && !positionsError && hasPositions && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Option</TableCell>
                    <TableCell align="right">Shares</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((pos, idx) => (
                      <TableRow key={`${pos.eventId}-${pos.option}-${idx}`}>
                        <TableCell>{getEventName(pos.eventId)}</TableCell>
                        <TableCell>
                          {getOptionName(pos.eventId, pos.option)}
                        </TableCell>
                        <TableCell align="right">{pos.amount}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </Paper>
      </Box>
  );
};

export default UserOrdersPage;
