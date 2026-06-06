import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";
import usePageTitle from "../hooks/usePageTitle";

const API_BASE = process.env.REACT_APP_QUOTTERY_API_BASE || "";
const METRICS = {
  PNL: "pnl",
  VOLUME: "volume",
};
const PAGE_SIZE = 50;
const POSITIVE_COLOR = "#39c979";
const NEGATIVE_COLOR = "#ef6674";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function formatNumeric(value, maxFractionDigits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const raw = String(value);
  const sign = raw.startsWith("-") ? "-" : "";
  const unsigned = sign ? raw.slice(1) : raw;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const integer = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  const fraction = fractionPart.slice(0, maxFractionDigits).replace(/0+$/g, "");
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}

function formatSignedAmount(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num === 0) return "0";
  return `${num > 0 ? "+" : "-"}${formatNumeric(Math.abs(num))}`;
}

function shortIdentity(value) {
  if (!value) return "-";
  const text = String(value);
  return text.length > 13 ? `${text.slice(0, 5)}...${text.slice(-5)}` : text;
}

const LeaderboardPage = () => {
  usePageTitle("Leaderboard");
  const theme = useTheme();
  const navigate = useNavigate();
  const [metric, setMetric] = useState(METRICS.PNL);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/quottery/leaderboard?metric=${metric}&limit=1000`));
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.details || body?.error || `Request failed with ${response.status}`);
      }
      setLeaders(body.leaders || []);
    } catch (err) {
      setLeaders([]);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const topStats = useMemo(() => {
    const totalAccounts = leaders.length;
    const topPnl = leaders.reduce((best, row) => Math.max(best, Number(row.realized_pnl || 0)), 0);
    const topVolume = leaders.reduce((best, row) => Math.max(best, Number(row.traded_volume || 0)), 0);
    return { totalAccounts, topPnl, topVolume };
  }, [leaders]);

  const panelSx = {
    p: { xs: 1.5, sm: 2 },
    borderRadius: 2,
    border: `1px solid ${alpha(theme.palette.text.primary, 0.14)}`,
    bgcolor: "background.paper",
  };

  const renderPnl = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value || 0);
    const color = num > 0 ? POSITIVE_COLOR : num < 0 ? NEGATIVE_COLOR : "text.secondary";
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
      </Typography>
    );
  };
  const pageCount = Math.max(1, Math.ceil(leaders.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedLeaders = leaders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [metric]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const renderTick = (tick, tickRef = null) => {
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
        sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
      >
        {explorerTickOrTxLabel(explorerRef, formatNumeric)}
      </Button>
    );
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", mt: 10, px: 2, mb: 8 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <LeaderboardIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ lineHeight: 1.2 }}>
              Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ranked by realized PnL or traded volume
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {loading && <Chip label="Refreshing" size="small" variant="outlined" />}
          <Tooltip title="Refresh">
            <span>
              <IconButton onClick={loadLeaderboard} disabled={loading} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...panelSx, mb: 2 }}>
        <Stack direction="row" spacing={3} useFlexGap sx={{ alignItems: "center", overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          <Box sx={{ minWidth: 132, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Accounts
            </Typography>
            <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatNumeric(topStats.totalAccounts)}</Typography>
          </Box>
          <Box sx={{ minWidth: 160, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Top realized PnL
            </Typography>
            {renderPnl(topStats.topPnl)}
          </Box>
          <Box sx={{ minWidth: 160, textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Top traded volume
            </Typography>
            <Typography sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatNumeric(topStats.topVolume)}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={panelSx}>
        <Tabs
          value={metric}
          onChange={(event, nextMetric) => setMetric(nextMetric)}
          sx={{
            alignSelf: "flex-start",
            minHeight: 38,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: "hidden",
            width: "fit-content",
            mb: 1.5,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              minHeight: 38,
              px: 2.5,
              textTransform: "none",
              fontWeight: 700,
              borderRight: `1px solid ${theme.palette.divider}`,
              "&:last-of-type": { borderRight: 0 },
            },
            "& .Mui-selected": {
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
            },
          }}
        >
          <Tab value={METRICS.PNL} label="Best PnL" />
          <Tab value={METRICS.VOLUME} label="Top volume" />
        </Tabs>

        {loading && !leaders.length ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : leaders.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>
            <Typography>No indexed accounts found.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 920, width: "100%" }}>
              <TableHead>
                <TableRow>
                  {["#", "Address", "Realized PnL", "Traded volume", "Trades", "Transfers", "Last seen tick"].map((label) => (
                    <TableCell
                      key={label}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: "text.secondary",
                        borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
                        whiteSpace: "nowrap",
                        py: 0.9,
                        px: 1,
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedLeaders.map((row, index) => (
                  <TableRow
                    key={row.identity}
                    sx={{ bgcolor: index % 2 === 1 ? alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.035 : 0.025) : "transparent" }}
                  >
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1, fontWeight: 800 }}>{row.rank || ((safePage - 1) * PAGE_SIZE) + index + 1}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate(`/profile/${row.identity}`)}
                          sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 800 }}
                        >
                          {shortIdentity(row.identity)}
                        </Button>
                        <Tooltip title="Open address in explorer">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://explorer.qubic.org/network/address/${row.identity}`}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ width: 24, height: 24 }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1 }}>{renderPnl(row.realized_pnl)}</TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {formatNumeric(row.traded_volume)}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1, fontVariantNumeric: "tabular-nums" }}>
                      {formatNumeric(row.trade_count)}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1, fontVariantNumeric: "tabular-nums" }}>
                      {formatNumeric(row.transfer_count)}
                    </TableCell>
                    <TableCell align="center" sx={{ borderBottom: 0, py: 0.75, px: 1, fontVariantNumeric: "tabular-nums" }}>
                      {renderTick(row.last_seen_tick, row.last_seen_tick_ref)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {leaders.length > PAGE_SIZE && (
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
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LeaderboardPage;
