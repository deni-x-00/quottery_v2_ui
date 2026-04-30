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
import { byteArrayToHexString } from "../components/qubic/util";
import {
  broadcastTransaction,
  getBasicInfo,
  getUserPositions,
  getUserOrdersFromBob,
} from "../components/qubic/util/bobApi";
import { tickOffset } from "../components/qubic/connect/config";
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
    getCurrentTick,
    allEvents,
    fetchOpenOrders,
  } = useQuotteryContext();

  const { getSignedTx } = useQubicConnect();
  const { bobUrl } = useConfig();
  const { showSnackbar } = useSnackbar();

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [ordersSource, setOrdersSource] = useState(null);

  // Positions state (via GetUserPosition SC function 6)
  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState(null);

  // Helper: resolve event name from allEvents
  const getEventName = useCallback(
      (eventId) => {
        const evt = (allEvents || []).find(
            (e) => String(e.eid) === String(eventId)
        );
        return evt ? evt.desc : `Event #${eventId}`;
      },
      [allEvents]
  );

  const getOptionName = useCallback(
      (eventId, option) => {
        const evt = (allEvents || []).find(
            (e) => String(e.eid) === String(eventId)
        );
        if (!evt) return `Option ${option}`;
        return option === 0
            ? evt.option0Desc || "Option 0"
            : evt.option1Desc || "Option 1";
      },
      [allEvents]
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
      setPositions(result?.positions ?? []);
    } catch (err) {
      console.error("Failed to load positions:", err);
      setPositionsError("Failed to load positions");
      setPositions([]);
    } finally {
      setPositionsLoading(false);
    }
  }, [bobUrl, walletPublicIdentity]);

  // ---- Load orders: try Bob logs first, fallback to order book scan ----
  const loadOrders = useCallback(async () => {
    if (!walletPublicIdentity) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    setOrdersError(null);

    try {
      // Try Bob log query first
      const bobOrders = await getUserOrdersFromBob(
          bobUrl,
          walletPublicIdentity
      );

      if (bobOrders !== null) {
        const enriched = bobOrders.map((o) => ({
          ...o,
          event_desc: getEventName(o.market_id),
        }));
        setOrders(enriched);
        setOrdersSource("bob");
        return;
      }

      // Fallback: scan order books
      console.info(
          "[Orders] Bob logs unavailable, falling back to order book scan"
      );
      const result = await fetchOpenOrders(walletPublicIdentity);
      setOrders(result?.orders ?? []);
      setOrdersSource("orderbook");
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrdersError("Failed to load orders");
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [bobUrl, walletPublicIdentity, fetchOpenOrders, getEventName]);

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

      const [currentTick, basicInfo] = await Promise.all([
        getCurrentTick(),
        getBasicInfo(bobUrl),
      ]);

      if (!currentTick) {
        showSnackbar("Failed to get current tick from network.", "error");
        return;
      }
      if (!basicInfo) {
        showSnackbar("Failed to get contract info.", "error");
        return;
      }

      const scheduledTick = currentTick + tickOffset;
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

      const confirmed = await getSignedTx(packet);
      if (!confirmed) return;

      const txHex =
          typeof confirmed.tx === "string"
              ? confirmed.tx
              : byteArrayToHexString(confirmed.tx);

      const res = await broadcastTransaction(bobUrl, txHex);

      if (res && !res.error) {
        showSnackbar("Order removal broadcasted successfully", "success");
        setTimeout(() => loadOrders(), 3000);
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
          <Typography variant="h4">My Recent Orders (last 20 ticks)</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {ordersSource && (
                <Chip
                    label={ordersSource === "bob" ? "Bob Logs" : "Order Book"}
                    size="small"
                    variant="outlined"
                    color={ordersSource === "bob" ? "primary" : "default"}
                />
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
          {ordersLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
          )}

          {!ordersLoading && ordersError && (
              <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>
                <Typography>{ordersError}</Typography>
              </Box>
          )}

          {!ordersLoading && !ordersError && !walletPublicIdentity && (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography>Connect your wallet to see your orders.</Typography>
              </Box>
          )}

          {!ordersLoading &&
              !ordersError &&
              walletPublicIdentity &&
              !hasOrders && (
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    <Typography>No orders found.</Typography>
                  </Box>
              )}

          {!ordersLoading && !ordersError && hasOrders && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Option</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    {ordersSource === "bob" && <TableCell>Tick</TableCell>}
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
                        {ordersSource === "bob" && (
                            <TableCell>{order.tick || "-"}</TableCell>
                        )}
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
          {positionsLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
          )}

          {!positionsLoading && positionsError && (
              <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>
                <Typography>{positionsError}</Typography>
              </Box>
          )}

          {!positionsLoading && !positionsError && !walletPublicIdentity && (
              <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                <Typography>
                  Connect your wallet to see your positions.
                </Typography>
              </Box>
          )}

          {!positionsLoading &&
              !positionsError &&
              walletPublicIdentity &&
              !hasPositions && (
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    <Typography>No open positions found.</Typography>
                  </Box>
              )}

          {!positionsLoading && !positionsError && hasPositions && (
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
