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
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { profileAvatarUrl } from "../api/quotteryApi";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";
import { useIdentitySearch, useLeaderboard, useLeaderboardEpochs } from "../hooks/data";
import usePageTitle from "../hooks/usePageTitle";
import {
  formatDateUtcMinute,
  formatNumeric,
  formatSignedAmount,
  normalizeIdentity,
  shortIdentity,
} from "../utils/format";
import { getCurrentWednesdayUtcWindow } from "../utils/timeWindows";
import { ActionIconButton, DataTable, MetricGrid, PageHeader, PageShell } from "../components/ui";
import { useTranslation } from "react-i18next";

const METRICS = {
  PNL: "pnl",
  VOLUME: "volume",
};
const PERIODS = {
  ALL: "all",
  WEEKLY: "weekly",
  EPOCH: "epoch",
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
  const [period, setPeriod] = useState(PERIODS.ALL);
  const [selectedEpoch, setSelectedEpoch] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const weeklyWindow = getCurrentWednesdayUtcWindow();
  const weeklyStart = period === PERIODS.WEEKLY ? weeklyWindow.start.toISOString() : null;
  const weeklyEnd = period === PERIODS.WEEKLY ? weeklyWindow.end.toISOString() : null;
  const { epochs, loading: epochsLoading } = useLeaderboardEpochs();
  const activeEpoch = period === PERIODS.EPOCH ? Number(selectedEpoch) || null : null;
  const selectedEpochMeta = epochs.find((item) => Number(item.epoch) === activeEpoch) || null;
  const { leaders, loading, error, refetch: loadLeaderboard } = useLeaderboard(metric, {
    startTime: weeklyStart,
    endTime: weeklyEnd,
    epoch: activeEpoch,
  });
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
  const segmentedTabsSx = {
    minHeight: 40,
    border: `1px solid ${theme.palette.border.default}`,
    borderRadius: 1.5,
    overflow: "hidden",
    width: "fit-content",
    "& .MuiTabs-indicator": { display: "none" },
    "& .MuiTab-root": {
      minHeight: 40,
      px: { xs: 1.75, sm: 2.5 },
      textTransform: "none",
      fontWeight: 900,
      borderRight: `1px solid ${theme.palette.border.default}`,
      "&:last-of-type": { borderRight: 0 },
    },
    "& .Mui-selected": {
      bgcolor: alpha(theme.palette.primary.main, 0.18),
    },
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
  }, [metric, period, selectedEpoch]);

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

  const allTimeColumns = [
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
  const leaderboardColumns = period !== PERIODS.ALL
    ? allTimeColumns.slice(0, 4)
    : allTimeColumns;
  const tableMinWidth = period !== PERIODS.ALL ? 660 : 920;

  const handleEpochChange = (event) => {
    const nextEpoch = event.target.value;
    if (!nextEpoch) return;
    setSelectedEpoch(nextEpoch);
    setPeriod(PERIODS.EPOCH);
  };

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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Tabs
            value={period === PERIODS.EPOCH ? false : period}
            onChange={(event, nextPeriod) => setPeriod(nextPeriod)}
            sx={segmentedTabsSx}
          >
            <Tab value={PERIODS.ALL} label={t("leaderboard.allTime")} />
            <Tab value={PERIODS.WEEKLY} label={t("leaderboard.thisWeek")} />
          </Tabs>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1.25}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {period === PERIODS.WEEKLY && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 750, fontVariantNumeric: "tabular-nums" }}
              >
                {formatDateUtcMinute(weeklyWindow.start)} - {formatDateUtcMinute(weeklyWindow.end)} UTC
              </Typography>
            )}
            {period === PERIODS.EPOCH && selectedEpochMeta?.first_activity_at && selectedEpochMeta?.last_activity_at && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 750, fontVariantNumeric: "tabular-nums" }}
              >
                {formatDateUtcMinute(selectedEpochMeta.first_activity_at)} - {formatDateUtcMinute(selectedEpochMeta.last_activity_at)} UTC
              </Typography>
            )}
            <Select
              size="small"
              value={period === PERIODS.EPOCH ? selectedEpoch : ""}
              onChange={handleEpochChange}
              displayEmpty
              disabled={epochsLoading || epochs.length === 0}
              IconComponent={ExpandMoreRoundedIcon}
              renderValue={(value) => (
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                  <Typography
                    component="span"
                    sx={{
                      color: value ? "primary.main" : "text.secondary",
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("leaderboard.epoch")}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: value ? "text.primary" : "text.secondary",
                      fontSize: "0.8125rem",
                      fontWeight: 800,
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {value || t("leaderboard.select")}
                  </Typography>
                </Stack>
              )}
              inputProps={{ "aria-label": t("leaderboard.selectEpoch") }}
              MenuProps={{
                anchorOrigin: { vertical: "bottom", horizontal: "right" },
                transformOrigin: { vertical: "top", horizontal: "right" },
                PaperProps: {
                  elevation: 0,
                  sx: {
                    mt: 0.75,
                    minWidth: 164,
                    maxHeight: 360,
                    p: 0.75,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.border.default}`,
                    bgcolor: theme.palette.background.paper,
                    backgroundImage: "none",
                    boxShadow: theme.palette.mode === "dark"
                      ? "0 16px 40px rgba(0, 0, 0, 0.48)"
                      : "0 16px 40px rgba(15, 23, 42, 0.16)",
                    "& .MuiList-root": { p: 0 },
                    "& .MuiMenuItem-root": {
                      minHeight: 38,
                      px: 1.25,
                      borderRadius: 1,
                      color: theme.palette.text.secondary,
                      fontSize: "0.8125rem",
                      fontWeight: 750,
                      fontVariantNumeric: "tabular-nums",
                      "&:hover": {
                        color: theme.palette.text.primary,
                        bgcolor: theme.palette.surface[2],
                      },
                      "&.Mui-selected": {
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.1),
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.17 : 0.14),
                      },
                    },
                  },
                },
              }}
              sx={{
                minWidth: { xs: "100%", sm: 164 },
                height: 40,
                borderRadius: 1,
                bgcolor: period === PERIODS.EPOCH
                  ? alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.07)
                  : theme.palette.surface[2],
                transition: "background-color 150ms ease, box-shadow 150ms ease",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  py: 0,
                  pl: 1.5,
                  pr: 4.25,
                },
                "& .MuiSelect-icon": {
                  right: 10,
                  color: period === PERIODS.EPOCH ? theme.palette.primary.main : theme.palette.text.secondary,
                  fontSize: 20,
                  transition: "transform 150ms ease, color 150ms ease",
                },
                "& .MuiSelect-iconOpen": { transform: "rotate(180deg)" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: period === PERIODS.EPOCH ? alpha(theme.palette.primary.main, 0.55) : theme.palette.border.default,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: period === PERIODS.EPOCH ? theme.palette.primary.main : theme.palette.border.strong,
                },
                "&.Mui-focused": {
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 1,
                },
              }}
            >
              {epochs.map((item) => (
                <MenuItem key={item.epoch} value={String(item.epoch)}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: "100%", gap: 2 }}>
                    <Box component="span">{t("leaderboard.epochValue", { epoch: item.epoch })}</Box>
                    {String(item.epoch) === selectedEpoch && <CheckRoundedIcon sx={{ fontSize: 17 }} />}
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
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
            ...segmentedTabsSx,
            alignSelf: "flex-start",
            mb: 1.5,
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
            minWidth={tableMinWidth}
          />
        ) : (
          <>
            <DataTable
              columns={leaderboardColumns}
              rows={pagedLeaders}
              emptyText={t("leaderboard.noAccounts")}
              minWidth={tableMinWidth}
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
