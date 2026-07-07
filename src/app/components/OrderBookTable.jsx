import React, { useCallback, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { formatQubicAmount } from "./qubic/util";
import { DataTable } from "./ui";

function buildOrderRows(entries, isBidSide) {
  const total = entries.reduce((acc, order) => acc + Number(order?.amount || 0), 0);
  let running = 0;

  return entries.map((order, index) => {
    const amount = Number(order?.amount || 0);
    running += amount;
    const depthPercent = total > 0 ? (running / total) * 100 : 0;

    return {
      ...order,
      __rowKey: `${isBidSide ? "bid" : "ask"}-${index}`,
      amount,
      running,
      depthPercent,
      isBidSide,
    };
  });
}

export default function OrderBookTable({
  bids,
  asks,
  maxHeight = 400,
}) {
  const theme = useTheme();
  const renderDepth = useCallback((row) => (
    <Box
      sx={{
        position: "relative",
        height: 24,
        width: "100%",
        minWidth: 100,
        overflow: "hidden",
        borderRadius: 0.75,
        bgcolor: alpha(theme.palette.text.primary, 0.04),
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: row.isBidSide ? 0 : undefined,
          right: row.isBidSide ? undefined : 0,
          width: `${row.depthPercent}%`,
          bgcolor: alpha(row.isBidSide ? theme.palette.success.main : theme.palette.error.main, 0.25),
          borderRadius: 0.75,
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
          justifyContent: row.isBidSide ? "flex-start" : "flex-end",
          color: "text.primary",
          fontWeight: 700,
          zIndex: 1,
        }}
      >
        {formatQubicAmount(row.running)}
      </Typography>
    </Box>
  ), [theme]);

  const columns = useMemo(() => [
    {
      key: "depth",
      label: "Depth",
      minWidth: 140,
      align: "left",
      render: renderDepth,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      numeric: true,
      render: (row) => formatQubicAmount(row.amount),
    },
    {
      key: "price",
      label: "Price",
      align: "right",
      numeric: true,
      render: (row) => formatQubicAmount(Number(row?.price ?? 0)),
    },
  ], [renderDepth]);

  const bidRows = useMemo(() => buildOrderRows(bids || [], true), [bids]);
  const askRows = useMemo(() => buildOrderRows(asks || [], false), [asks]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Buy Orders</Typography>
        <DataTable
          columns={columns}
          rows={bidRows}
          emptyText="No buy orders"
          minWidth={420}
          stickyHeader
          maxHeight={maxHeight}
          getRowKey={(row) => row.__rowKey}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Sell Orders</Typography>
        <DataTable
          columns={columns}
          rows={askRows}
          emptyText="No sell orders"
          minWidth={420}
          stickyHeader
          maxHeight={maxHeight}
          getRowKey={(row) => row.__rowKey}
        />
      </Grid>
    </Grid>
  );
}
