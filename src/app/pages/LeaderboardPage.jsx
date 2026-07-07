import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";
import { useIdentitySearch, useLeaderboard } from "../hooks/data";
import usePageTitle from "../hooks/usePageTitle";
import { formatNumeric, formatSignedAmount, normalizeIdentity, shortIdentity } from "../utils/format";
import { ActionIconButton, DataTable, MetricGrid, PageHeader, PageShell } from "../components/ui";

const METRICS = {
  PNL: "pnl",
  VOLUME: "volume",
};
const PAGE_SIZE = 50;
const SEARCH_RESET_REASON = "reset";
const IDENTITY_RE = /^[A-Z]{56,60}$/;

const LeaderboardPage = () => {
  usePageTitle("Leaderboard");
  const theme = useTheme();
  const navigate = useNavigate();
  const [metric, setMetric] = useState(METRICS.PNL);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { leaders, loading, error, refetch: loadLeaderboard } = useLeaderboard(metric);
  const {
    options: searchOptions,
    loading: searchLoading,
    setOptions: setSearchOptions,
  } = useIdentitySearch(search, { identityRegex: IDENTITY_RE });

  const openPortfolio = useCallback((identityValue) => {
    const identity = normalizeIdentity(identityValue);
    if (!identity) return;
    navigate(`/portfolio/${identity}`);
    setSearch("");
    setSearchOptions([]);
  }, [navigate, setSearchOptions]);

  const handleSearch = (event) => {
    event.preventDefault();
    openPortfolio(search);
  };

  const topStats = useMemo(() => {
    const totalAccounts = leaders.length;
    const topPnl = leaders.reduce((best, row) => Math.max(best, Number(row.realized_pnl || 0)), 0);
    const topVolume = leaders.reduce((best, row) => Math.max(best, Number(row.traded_volume || 0)), 0);
    return { totalAccounts, topPnl, topVolume };
  }, [leaders]);
  const panelSx = {
    p: { xs: 1.5, sm: 2 },
    borderRadius: 1.5,
    border: `1px solid ${theme.palette.border.soft}`,
    bgcolor: theme.palette.surface[1],
    boxShadow: "none",
  };

  const renderPnl = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value || 0);
    const color = num > 0 ? theme.palette.success.main : num < 0 ? theme.palette.error.main : "text.secondary";
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
  const leaderboardMetrics = [
    { label: "Accounts", value: formatNumeric(topStats.totalAccounts) },
    { label: "Top realized PnL", value: renderPnl(topStats.topPnl) },
    { label: "Top traded volume", value: formatNumeric(topStats.topVolume) },
  ];
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

  const leaderboardColumns = [
    {
      key: "rank",
      label: "#",
      numeric: true,
      render: (row, index) => row.rank || ((safePage - 1) * PAGE_SIZE) + index + 1,
    },
    {
      key: "identity",
      label: "Address",
      minWidth: 180,
      render: (row) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <Button
            size="small"
            variant="text"
            onClick={() => navigate(`/portfolio/${row.identity}`)}
            sx={{ minWidth: 0, px: 0, textTransform: "none", fontWeight: 900 }}
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
      ),
    },
    { key: "realized_pnl", label: "Realized PnL", render: (row) => renderPnl(row.realized_pnl) },
    { key: "traded_volume", label: "Traded volume", numeric: true, cellSx: { fontWeight: 800 }, render: (row) => formatNumeric(row.traded_volume) },
    { key: "trade_count", label: "Trades", numeric: true, render: (row) => formatNumeric(row.trade_count) },
    { key: "transfer_count", label: "Transfers", numeric: true, render: (row) => formatNumeric(row.transfer_count) },
    { key: "last_seen_tick", label: "Last seen tick", numeric: true, render: (row) => renderTick(row.last_seen_tick, row.last_seen_tick_ref) },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Accounts"
        title="Leaderboard"
        description="Ranked by realized PnL or traded volume"
        icon={<LeaderboardIcon />}
        actions={(
          <Box component="form" onSubmit={handleSearch} sx={{ display: "flex", gap: 1, minWidth: { xs: 0, md: 520 } }}>
          <Autocomplete
            freeSolo
            fullWidth
            options={searchOptions}
            inputValue={search}
            value={null}
            loading={searchLoading}
            clearOnBlur={false}
            selectOnFocus={false}
            autoSelect={false}
            blurOnSelect
            getOptionLabel={(option) => (typeof option === "string" ? option : option?.identity || "")}
            isOptionEqualToValue={(option, value) => option?.identity === value?.identity}
            onInputChange={(event, nextValue, reason) => {
              if (reason === SEARCH_RESET_REASON) return;
              setSearch(nextValue);
            }}
            onChange={(event, option) => {
              openPortfolio(typeof option === "string" ? option : option?.identity);
            }}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.identity}>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontFamily: "monospace" }}>{shortIdentity(option.identity)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {option.source === "typed" ? "Open pasted address" : `Volume ${formatNumeric(option.traded_volume)} | PnL ${formatSignedAmount(option.realized_pnl)}`}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Search address"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: "off",
                }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  sx: {
                    minHeight: 42,
                    borderRadius: 1.25,
                    bgcolor: theme.palette.surface[2],
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.border.soft,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.border.default,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            )}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <ActionIconButton
                  label="Open portfolio"
                  tooltip="Open portfolio"
                  type="submit"
                  color="primary"
                  disabled={!normalizeIdentity(search)}
            >
                  <SearchIcon fontSize="small" />
            </ActionIconButton>
          {loading && <Chip label="Refreshing" size="small" variant="outlined" />}
          <ActionIconButton
                label="Refresh leaderboard"
                tooltip="Refresh"
                onClick={loadLeaderboard}
                disabled={loading}
          >
                <RefreshIcon fontSize="small" />
          </ActionIconButton>
          </Stack>
          </Box>
        )}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...panelSx, mb: 2 }}>
        <MetricGrid
          metrics={leaderboardMetrics}
          columns={{ xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }}
          compact
        />
      </Paper>

      <Paper elevation={0} sx={panelSx}>
        <Tabs
          value={metric}
          onChange={(event, nextMetric) => setMetric(nextMetric)}
          sx={{
            alignSelf: "flex-start",
            minHeight: 40,
            border: `1px solid ${theme.palette.border.default}`,
            borderRadius: 1.5,
            overflow: "hidden",
            width: "fit-content",
            mb: 1.5,
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
          <Tab value={METRICS.PNL} label="Best PnL" />
          <Tab value={METRICS.VOLUME} label="Top volume" />
        </Tabs>

        {loading && !leaders.length ? (
          <DataTable
            columns={leaderboardColumns}
            rows={[]}
            loading
            skeletonRows={8}
            minWidth={920}
          />
        ) : (
          <>
            <DataTable
              columns={leaderboardColumns}
              rows={pagedLeaders}
              emptyText="No indexed accounts found."
              minWidth={920}
              getRowKey={(row) => row.identity}
            />
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
          </>
        )}
      </Paper>
    </PageShell>
  );
};

export default LeaderboardPage;
