import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Avatar,
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
import { profileAvatarUrl } from "../api/quotteryApi";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";
import { useIdentitySearch, useLeaderboard } from "../hooks/data";
import usePageTitle from "../hooks/usePageTitle";
import { formatNumeric, formatSignedAmount, normalizeIdentity, shortIdentity } from "../utils/format";
import { ActionIconButton, DataTable, MetricGrid, PageHeader, PageShell } from "../components/ui";
import { useTranslation } from "react-i18next";

const METRICS = {
  PNL: "pnl",
  VOLUME: "volume",
};
const PAGE_SIZE = 50;
const SEARCH_RESET_REASON = "reset";
const IDENTITY_RE = /^[A-Z]{56,60}$/;

const LeaderboardPage = () => {
  const { t } = useTranslation();
  usePageTitle(t("leaderboard.pageTitle"));
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
    if (IDENTITY_RE.test(normalizeIdentity(search))) {
      openPortfolio(search);
      return;
    }
    if (searchOptions[0]?.identity) openPortfolio(searchOptions[0].identity);
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
    { label: t("leaderboard.accounts"), value: formatNumeric(topStats.totalAccounts) },
    { label: t("leaderboard.topRealizedPnl"), value: renderPnl(topStats.topPnl) },
    { label: t("leaderboard.topTradedVolume"), value: formatNumeric(topStats.topVolume) },
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
      label: t("leaderboard.rank"),
      numeric: true,
      render: (row, index) => row.rank || ((safePage - 1) * PAGE_SIZE) + index + 1,
    },
    {
      key: "identity",
      label: t("leaderboard.address"),
      minWidth: 220,
      render: (row) => (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-start"
          sx={{ width: 210, maxWidth: "100%", minWidth: 0, mx: "auto", gap: 0.75 }}
        >
          <Avatar
            src={row.has_avatar ? profileAvatarUrl(row.identity, row.avatar_updated_at) : undefined}
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              fontSize: "0.75rem",
              bgcolor: alpha(theme.palette.primary.main, 0.16),
              color: "primary.main",
            }}
          >
            {(row.display_name || row.identity || "?").slice(0, 1).toUpperCase()}
          </Avatar>
          <Button
            size="small"
            variant="text"
            onClick={() => navigate(`/portfolio/${row.identity}`)}
            title={row.display_name ? `${row.display_name} - ${row.identity}` : row.identity}
            sx={{
              minWidth: 0,
              justifyContent: "flex-start",
              px: 0,
              textTransform: "none",
              fontWeight: 900,
              textAlign: "left",
            }}
          >
            <Box component="span" sx={{ display: "block", maxWidth: 128, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.display_name || shortIdentity(row.identity)}
            </Box>
          </Button>
          <Tooltip title={t("leaderboard.openExplorer")}>
            <IconButton
              size="small"
              component="a"
              href={`https://explorer.qubic.org/network/address/${row.identity}`}
              target="_blank"
              rel="noreferrer"
              sx={{ width: 24, height: 24, flexShrink: 0 }}
            >
              <OpenInNewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    { key: "realized_pnl", label: t("leaderboard.realizedPnl"), render: (row) => renderPnl(row.realized_pnl) },
    { key: "traded_volume", label: t("leaderboard.tradedVolume"), numeric: true, cellSx: { fontWeight: 800 }, render: (row) => formatNumeric(row.traded_volume) },
    { key: "trade_count", label: t("leaderboard.trades"), numeric: true, render: (row) => formatNumeric(row.trade_count) },
    { key: "transfer_count", label: t("leaderboard.transfers"), numeric: true, render: (row) => formatNumeric(row.transfer_count) },
    { key: "last_seen_tick", label: t("leaderboard.lastSeenTick"), numeric: true, render: (row) => renderTick(row.last_seen_tick, row.last_seen_tick_ref) },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("leaderboard.eyebrow")}
        title={t("leaderboard.title")}
        description={t("leaderboard.description")}
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
            getOptionLabel={(option) => (typeof option === "string" ? option : option?.display_name || option?.identity || "")}
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
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar
                    src={option.has_avatar ? profileAvatarUrl(option.identity, option.avatar_updated_at) : undefined}
                    sx={{ width: 28, height: 28, fontSize: "0.78rem", bgcolor: alpha(theme.palette.primary.main, 0.16), color: "primary.main" }}
                  >
                    {(option.display_name || option.identity || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                    {option.display_name && <Typography sx={{ fontWeight: 800 }}>{option.display_name}</Typography>}
                    <Typography sx={{ fontWeight: option.display_name ? 650 : 700, fontFamily: "monospace", fontSize: option.display_name ? "0.78rem" : "0.9rem" }}>{shortIdentity(option.identity)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {option.source === "typed"
                        ? t("leaderboard.typedAddress")
                        : t("leaderboard.volumePnl", {
                          volume: formatNumeric(option.traded_volume),
                          pnl: formatSignedAmount(option.realized_pnl),
                        })}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder={t("leaderboard.searchName")}
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
                  label={t("leaderboard.openPortfolio")}
                  tooltip={t("leaderboard.openPortfolio")}
                  type="submit"
                  color="primary"
                  disabled={!String(search || "").trim() || (!IDENTITY_RE.test(normalizeIdentity(search)) && searchOptions.length === 0)}
            >
                  <SearchIcon fontSize="small" />
            </ActionIconButton>
          {loading && <Chip label={t("leaderboard.refreshing")} size="small" variant="outlined" />}
          <ActionIconButton
                label={t("leaderboard.refresh")}
                tooltip={t("leaderboard.refresh")}
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
          <Tab value={METRICS.PNL} label={t("leaderboard.bestPnl")} />
          <Tab value={METRICS.VOLUME} label={t("leaderboard.topVolume")} />
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
              emptyText={t("leaderboard.noAccounts")}
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
