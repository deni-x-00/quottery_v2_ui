import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AnimatePresence, motion } from "framer-motion";
import ModernSearchFilter from "../components/SearchFilter";
import EventOverviewCard from "../components/EventOverviewCard";
import { ActionIconButton, DataTable, EmptyState, LoadingSkeleton, MetricGrid, PageHeader, PageShell } from "../components/ui";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useArchivedEvents } from "../hooks/data";
import { useTxTracker } from "../hooks/useTxTracker";
import usePageTitle from "../hooks/usePageTitle";
import { TAG_GROUPS, getAllTags, getCanonicalTagId, getTagGroupId, getTagIdBySlug, getTagSlug, getTagsForGroup } from "../components/qubic/util/tagMap";
import { isEventClosed, parseQubicUtcDate } from "../components/qubic/util/tradeValidation";
import { fetchCachedEventVolumes, fetchEventVolumesByIds, formatCompactAmount, getEventId } from "../utils/eventVolumes";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";
import { formatDateUtc, formatInteger, formatRational } from "../utils/format";
import { useTranslation } from "react-i18next";

const SORT_MODES = {
  VOLUME: "volume",
  OPEN_VOLUME: "open-volume",
  NEWEST: "newest",
  ENDING_SOON: "ending-soon",
  CREATED_DATE: "created-date",
  ARCHIVED_DATE: "archived-date",
};
const SORT_DIRECTIONS = {
  DESC: "desc",
  ASC: "asc",
};

const SORT_LABEL_KEYS = {
  [SORT_MODES.VOLUME]: "markets.sortTraded",
  [SORT_MODES.OPEN_VOLUME]: "markets.sortOpen",
  [SORT_MODES.NEWEST]: "markets.sortNewest",
  [SORT_MODES.ENDING_SOON]: "markets.sortEnding",
  [SORT_MODES.CREATED_DATE]: "markets.sortCreated",
  [SORT_MODES.ARCHIVED_DATE]: "markets.sortArchived",
};
const SORT_DIRECTION_LABEL_KEYS = {
  [SORT_DIRECTIONS.DESC]: "markets.directionNewest",
  [SORT_DIRECTIONS.ASC]: "markets.directionOldest",
};

const EVENT_VIEW = {
  ACTIVE: "active",
  ARCHIVE: "archive",
};
const PAGE_SIZE = 50;
const EVENT_METRICS_REFRESH_MS = 15000;
const EVENT_METRICS_DUPLICATE_WINDOW_MS = 5000;

function winnerLabel(event, t) {
  if (event?.result === null || event?.result === undefined) return t("markets.pending");
  if (Number(event.result) === 0) return event.option0 || t("markets.yes");
  if (Number(event.result) === 1) return event.option1 || t("markets.no");
  return String(event.result);
}

const getValidSortMode = (sortMode) => (
    [SORT_MODES.OPEN_VOLUME, SORT_MODES.NEWEST, SORT_MODES.ENDING_SOON, SORT_MODES.CREATED_DATE, SORT_MODES.ARCHIVED_DATE].includes(sortMode)
        ? sortMode
        : SORT_MODES.VOLUME
);
const getValidSortDirection = (direction) => (
  direction === SORT_DIRECTIONS.ASC ? SORT_DIRECTIONS.ASC : SORT_DIRECTIONS.DESC
);

const isValidGroupId = (groupId) => (
  groupId === "all" || TAG_GROUPS.some((group) => group.id === groupId)
);

const getValidGroupId = (groupId) => (
  isValidGroupId(groupId) ? groupId : "all"
);

const getValidTopicId = (topicId, groupId = null) => {
  if (topicId === null || topicId === undefined || topicId === "") return "";
  const topicValue = String(topicId).trim();

  if (/^\d+$/.test(topicValue)) {
    const id = Number(topicValue);
    if (!Number.isFinite(id) || id <= 0) return "";
    return getAllTags().some((tag) => tag.id === id) ? String(id) : "";
  }

  const id = getTagIdBySlug(topicValue, groupId);
  return id > 0 ? String(id) : "";
};

function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const { bobUrl, isConnected } = useConfig();
  const { allEvents, loading, fetchEvents } = useQuotteryContext();
  const { trackTx } = useTxTracker();
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState({});
  const [sortMenuAnchorEl, setSortMenuAnchorEl] = useState(null);
  const [eventVolumes, setEventVolumes] = useState({});
  const [eventOpenOrderVolumes, setEventOpenOrderVolumes] = useState({});
  const [eventProbabilities, setEventProbabilities] = useState({});
  const [eventPriceToBeat, setEventPriceToBeat] = useState({});
  const [archivePage, setArchivePage] = useState(1);
  const [showZeroVolumeArchiveEvents, setShowZeroVolumeArchiveEvents] = useState(false);
  const {
    events: archivedEvents,
    loading: archiveLoading,
    error: archiveError,
    refetch: loadArchivedEvents,
  } = useArchivedEvents();
  const lastImmediateMetricsRef = useRef({ key: "", at: 0 });
  const requestedGroupId = getValidGroupId(searchParams.get("group"));
  const selectedView = searchParams.get("view") === EVENT_VIEW.ARCHIVE ? EVENT_VIEW.ARCHIVE : EVENT_VIEW.ACTIVE;
  usePageTitle(selectedView === EVENT_VIEW.ARCHIVE ? t("markets.archivePageTitle") : t("markets.pageTitle"));
  const selectedTopicId = getValidTopicId(searchParams.get("topic"), requestedGroupId);
  const selectedGroupId = selectedTopicId
      ? getTagGroupId(Number(selectedTopicId))
      : requestedGroupId;
  const selectedSortMode = getValidSortMode(searchParams.get("sort"));
  const selectedSortDirection = getValidSortDirection(searchParams.get("dir"));
  const activeSortMode = [SORT_MODES.VOLUME, SORT_MODES.OPEN_VOLUME, SORT_MODES.ENDING_SOON, SORT_MODES.NEWEST].includes(selectedSortMode)
      ? selectedSortMode
      : SORT_MODES.VOLUME;
  const archiveSortMode = [SORT_MODES.VOLUME, SORT_MODES.CREATED_DATE, SORT_MODES.ARCHIVED_DATE].includes(selectedSortMode)
      ? selectedSortMode
      : SORT_MODES.VOLUME;
  const sortOptions = selectedView === EVENT_VIEW.ARCHIVE
      ? [SORT_MODES.VOLUME, SORT_MODES.CREATED_DATE, SORT_MODES.ARCHIVED_DATE]
      : [SORT_MODES.VOLUME, SORT_MODES.OPEN_VOLUME, SORT_MODES.ENDING_SOON, SORT_MODES.NEWEST];
  const searchTerm = searchParams.get("q") || "";
  const eventsReturnPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!isConnected) return;
    const loadEvents = async () => {
      setIsFilterLoading(true);
      try {
        await fetchEvents();
      } finally {
        setIsFilterLoading(false);
      }
    };
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const handleRefresh = async () => {
    if (selectedView === EVENT_VIEW.ARCHIVE) {
      await loadArchivedEvents();
      return;
    }

    setIsFilterLoading(true);
    try {
      await fetchEvents();
    } finally {
      setIsFilterLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected || !Array.isArray(allEvents) || allEvents.length === 0) {
      setEventVolumes({});
      setEventOpenOrderVolumes({});
      setEventProbabilities({});
      setEventPriceToBeat({});
      return undefined;
    }

    const controller = new AbortController();
    const metricsKey = allEvents
        .map(getEventId)
        .filter((eventId) => eventId !== undefined && eventId !== null)
        .join(",");
    const mergeVolumes = (volumes) => {
      setEventVolumes((prev) => ({ ...prev, ...(volumes || {}) }));
    };
    const mergeOpenOrderVolumes = (volumes) => {
      setEventOpenOrderVolumes((prev) => ({ ...prev, ...(volumes || {}) }));
    };
    const mergeProbabilities = (probabilities) => {
      setEventProbabilities((prev) => ({ ...prev, ...(probabilities || {}) }));
    };
    const mergePriceToBeat = (values) => {
      setEventPriceToBeat((prev) => ({ ...prev, ...(values || {}) }));
    };

    const loadVolumes = async ({ immediate = false } = {}) => {
      if (immediate) {
        const now = Date.now();
        const last = lastImmediateMetricsRef.current;
        if (last.key === metricsKey && now - last.at < EVENT_METRICS_DUPLICATE_WINDOW_MS) {
          return;
        }
        lastImmediateMetricsRef.current = { key: metricsKey, at: now };
      }

      try {
        const firstResult = await fetchCachedEventVolumes(bobUrl, allEvents, controller.signal);
        mergeVolumes(firstResult.volumes);
        mergeOpenOrderVolumes(firstResult.openOrderVolumes);
        mergeProbabilities(firstResult.probabilities);
        mergePriceToBeat(firstResult.priceToBeat);

        let deferredEventIds = firstResult.deferredEventIds || [];
        while (deferredEventIds.length > 0 && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (controller.signal.aborted) return;

          const nextResult = await fetchEventVolumesByIds(bobUrl, deferredEventIds, controller.signal);
          mergeVolumes(nextResult.volumes);
          mergeOpenOrderVolumes(nextResult.openOrderVolumes);
          mergeProbabilities(nextResult.probabilities);
          mergePriceToBeat(nextResult.priceToBeat);
          deferredEventIds = nextResult.deferredEventIds || [];
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("[EventsPage] Failed to load cached event volumes:", error.message);
        }
      }
    };

    loadVolumes({ immediate: true });
    const intervalId = setInterval(loadVolumes, EVENT_METRICS_REFRESH_MS);
    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [allEvents, bobUrl, isConnected]);

  const baseEventsToDisplay = React.useMemo(() => {
    const safeEvents = Array.isArray(allEvents) ? allEvents : [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return safeEvents;

    return safeEvents.filter((event) => {
      const descMatches = (event.desc || "").toLowerCase().includes(term);
      const opt0Matches = (event.option0Desc || "").toLowerCase().includes(term);
      const opt1Matches = (event.option1Desc || "").toLowerCase().includes(term);
      return descMatches || opt0Matches || opt1Matches;
    });
  }, [allEvents, searchTerm]);

  const visibleTags = React.useMemo(() => getAllTags().filter((tag) => tag.id > 0), []);

  const eventCounts = React.useMemo(() => {
    const counts = { all: baseEventsToDisplay.length };
    for (const group of TAG_GROUPS) counts[group.id] = 0;
    for (const tag of visibleTags) counts[tag.id] = 0;

    for (const event of baseEventsToDisplay) {
      const rawTagId = Number(event.tag);
      const tagId = getCanonicalTagId(rawTagId);
      const groupId = getTagGroupId(rawTagId);
      counts[groupId] = (counts[groupId] || 0) + 1;
      if (tagId > 0) counts[tagId] = (counts[tagId] || 0) + 1;
    }

    return counts;
  }, [baseEventsToDisplay, visibleTags]);

  const groupOptions = React.useMemo(() => [
    { id: "all", label: t("markets.all") },
    ...TAG_GROUPS.map((group) => ({
      ...group,
      label: t(`markets.groups.${group.id}`, { defaultValue: group.label }),
    })),
  ], [t]);

  const translateTag = React.useCallback((tag) => (
    t(`markets.tags.${getTagSlug(tag.id)}`, { defaultValue: tag.label })
  ), [t]);

  const sidebarItems = React.useMemo(() => {
    if (selectedGroupId === "all") {
      const items = [{ type: "all", id: "", label: t("markets.allMarkets") }];

      for (const group of TAG_GROUPS) {
        items.push({
          type: "group",
          id: group.id,
          label: t(`markets.groups.${group.id}`, { defaultValue: group.label }),
        });
        if (expandedGroupIds[group.id]) {
          items.push(
              ...getTagsForGroup(group.id).map((tag) => ({
                type: "tag",
                groupId: group.id,
                nested: true,
                ...tag,
                label: translateTag(tag),
              }))
          );
        }
      }

      return items;
    }

    return [
      {
        type: "all",
        id: "",
        label: t("markets.allGroup", {
          group: groupOptions.find((group) => group.id === selectedGroupId)?.label || t("markets.title"),
        }),
      },
      ...getTagsForGroup(selectedGroupId).map((tag) => ({
        type: "tag",
        groupId: selectedGroupId,
        ...tag,
        label: translateTag(tag),
      })),
    ];
  }, [expandedGroupIds, groupOptions, selectedGroupId, t, translateTag]);

  const eventsToDisplay = React.useMemo(() => {
    const compareEndingSoon = (a, b) => {
      const now = new Date();
      const aEnded = isEventClosed(a, now);
      const bEnded = isEventClosed(b, now);
      if (aEnded !== bEnded) return aEnded ? 1 : -1;

      const aEndTime = parseQubicUtcDate(a?.endDate)?.getTime();
      const bEndTime = parseQubicUtcDate(b?.endDate)?.getTime();
      const aSafeEndTime = Number.isFinite(aEndTime) ? aEndTime : Number.MAX_SAFE_INTEGER;
      const bSafeEndTime = Number.isFinite(bEndTime) ? bEndTime : Number.MAX_SAFE_INTEGER;
      if (aSafeEndTime !== bSafeEndTime) {
        return aEnded ? bSafeEndTime - aSafeEndTime : aSafeEndTime - bSafeEndTime;
      }

      return Number(getEventId(b) ?? 0) - Number(getEventId(a) ?? 0);
    };

    const sortEvents = (events) => {
      if (activeSortMode === SORT_MODES.VOLUME) {
        return [...events].sort((a, b) => {
          const aId = getEventId(a);
          const bId = getEventId(b);
          const aVolume = Number(eventVolumes[aId] || 0);
          const bVolume = Number(eventVolumes[bId] || 0);
          if (aVolume !== bVolume) return bVolume - aVolume;
          return compareEndingSoon(a, b);
        });
      }

      if (activeSortMode === SORT_MODES.OPEN_VOLUME) {
        return [...events].sort((a, b) => {
          const aId = getEventId(a);
          const bId = getEventId(b);
          const aVolume = Number(eventOpenOrderVolumes[aId] || 0);
          const bVolume = Number(eventOpenOrderVolumes[bId] || 0);
          if (aVolume !== bVolume) return bVolume - aVolume;
          return compareEndingSoon(a, b);
        });
      }

      if (activeSortMode === SORT_MODES.ENDING_SOON) {
        return [...events].sort(compareEndingSoon);
      }

      return [...events].sort((a, b) => Number(getEventId(b) ?? 0) - Number(getEventId(a) ?? 0));
    };

    if (selectedTopicId) {
      const topicId = Number(selectedTopicId);
      return sortEvents(baseEventsToDisplay.filter((event) => getCanonicalTagId(event.tag) === topicId));
    }
    if (selectedGroupId === "all") return sortEvents(baseEventsToDisplay);
    return sortEvents(baseEventsToDisplay.filter((event) => getTagGroupId(event.tag) === selectedGroupId));
  }, [activeSortMode, baseEventsToDisplay, eventOpenOrderVolumes, eventVolumes, selectedGroupId, selectedTopicId]);

  const activeMarketStats = React.useMemo(() => {
    return eventsToDisplay.reduce((stats, event) => {
      const eventId = getEventId(event);
      stats.tradedVolume += Number(eventVolumes[eventId] || 0);
      stats.openOrderVolume += Number(eventOpenOrderVolumes[eventId] || 0);
      return stats;
    }, {
      count: eventsToDisplay.length,
      tradedVolume: 0,
      openOrderVolume: 0,
    });
  }, [eventOpenOrderVolumes, eventVolumes, eventsToDisplay]);

  const updateEventsQuery = React.useCallback((updates, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    if (Object.prototype.hasOwnProperty.call(updates, "group")) {
      const nextGroupId = getValidGroupId(updates.group);
      if (nextGroupId === "all") {
        nextParams.delete("group");
      } else {
        nextParams.set("group", nextGroupId);
      }
      nextParams.delete("topic");
    }

    if (Object.prototype.hasOwnProperty.call(updates, "topic")) {
      const nextTopicId = getValidTopicId(updates.topic, getValidGroupId(nextParams.get("group")));
      nextParams.delete("topic");
      if (nextTopicId) {
        nextParams.set("topic", getTagSlug(Number(nextTopicId)));
        nextParams.set("group", getTagGroupId(Number(nextTopicId)));
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "q")) {
      const nextSearchTerm = String(updates.q || "");
      if (nextSearchTerm) {
        nextParams.set("q", nextSearchTerm);
      } else {
        nextParams.delete("q");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "sort")) {
      const nextSortMode = getValidSortMode(updates.sort);
      if (nextSortMode === SORT_MODES.VOLUME) {
        nextParams.delete("sort");
        nextParams.delete("dir");
      } else {
        nextParams.set("sort", nextSortMode);
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "dir")) {
      const nextDirection = getValidSortDirection(updates.dir);
      if (nextDirection === SORT_DIRECTIONS.DESC) {
        nextParams.delete("dir");
      } else {
        nextParams.set("dir", nextDirection);
      }
    }

    setSearchParams(nextParams, { replace: Boolean(options.replace) });
  }, [searchParams, setSearchParams]);

  const handleSearchChange = React.useCallback((value) => {
    updateEventsQuery({ q: value }, { replace: true });
  }, [updateEventsQuery]);

  const handleGroupChange = React.useCallback((groupId) => {
    updateEventsQuery({ group: groupId });
  }, [updateEventsQuery]);

  const handleSortMenuOpen = React.useCallback((event) => {
    setSortMenuAnchorEl(event.currentTarget);
  }, []);

  const handleSortMenuClose = React.useCallback(() => {
    setSortMenuAnchorEl(null);
  }, []);

  const handleSortChange = React.useCallback((sortMode) => {
    updateEventsQuery({ sort: sortMode });
    setSortMenuAnchorEl(null);
  }, [updateEventsQuery]);

  const handleViewChange = React.useCallback((event, nextView) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextView === EVENT_VIEW.ARCHIVE) nextParams.set("view", EVENT_VIEW.ARCHIVE);
    else nextParams.delete("view");
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroupIds((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const handleSidebarItemClick = (item) => {
    if (item.type === "group") {
      handleGroupChange(item.id);
      return;
    }

    if (item.type === "tag") {
      updateEventsQuery({ topic: String(item.id) });
      return;
    }

    updateEventsQuery({ topic: "" });
  };

  const renderLoading = () => <LoadingSkeleton variant="cards" cards={6} />;

  const archivedEventsToDisplay = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const rows = Array.isArray(archivedEvents) ? archivedEvents : [];
    const searchedRows = !term ? rows : /^\d+$/.test(term)
      ? rows.filter((event) => String(event.event_id || "") === term)
      : rows.filter((event) =>
          String(event.description || "").toLowerCase().includes(term)
          || String(event.option0 || "").toLowerCase().includes(term)
          || String(event.option1 || "").toLowerCase().includes(term)
      );
    const filteredRows = showZeroVolumeArchiveEvents
      ? searchedRows
      : searchedRows.filter((event) => Number(event.traded_volume || 0) > 0);

    const getCreatedTime = (event) => {
      const time = new Date(event.created_tx_timestamp || 0).getTime();
      return Number.isFinite(time) && time > 0 ? time : Number(event.created_tick || 0);
    };
    const getArchivedTime = (event) => {
      const time = new Date(event.archived_tx_timestamp || event.finalized_tx_timestamp || event.result_tx_timestamp || 0).getTime();
      return Number.isFinite(time) && time > 0 ? time : Number(event.archived_tick || event.finalized_tick || event.result_tick || 0);
    };

    return [...filteredRows].sort((a, b) => {
      if (archiveSortMode === SORT_MODES.CREATED_DATE) {
        const delta = getCreatedTime(b) - getCreatedTime(a);
        return selectedSortDirection === SORT_DIRECTIONS.ASC ? -delta : delta;
      }
      if (archiveSortMode === SORT_MODES.ARCHIVED_DATE) {
        const delta = getArchivedTime(b) - getArchivedTime(a);
        return selectedSortDirection === SORT_DIRECTIONS.ASC ? -delta : delta;
      }
      const volumeDelta = Number(b.traded_volume || 0) - Number(a.traded_volume || 0);
      if (volumeDelta !== 0) return volumeDelta;
      return getArchivedTime(b) - getArchivedTime(a);
    });
  }, [archiveSortMode, archivedEvents, searchTerm, selectedSortDirection, showZeroVolumeArchiveEvents]);
  const archivePageCount = Math.max(1, Math.ceil(archivedEventsToDisplay.length / PAGE_SIZE));
  const safeArchivePage = Math.min(archivePage, archivePageCount);
  const pagedArchivedEvents = archivedEventsToDisplay.slice((safeArchivePage - 1) * PAGE_SIZE, safeArchivePage * PAGE_SIZE);
  const marketMetrics = [
    {
      label: selectedView === EVENT_VIEW.ARCHIVE ? t("markets.archivedMarkets") : t("markets.activeMarkets"),
      value: selectedView === EVENT_VIEW.ARCHIVE ? archivedEventsToDisplay.length : activeMarketStats.count,
      tone: "cyan",
    },
    {
      label: t("markets.tradedVolume"),
      value: formatCompactAmount(selectedView === EVENT_VIEW.ARCHIVE
        ? archivedEventsToDisplay.reduce((sum, event) => sum + Number(event.traded_volume || 0), 0)
        : activeMarketStats.tradedVolume),
    },
    {
      label: t("markets.openOrders"),
      value: selectedView === EVENT_VIEW.ARCHIVE ? "-" : formatCompactAmount(activeMarketStats.openOrderVolume),
      tone: "muted",
    },
  ];

  useEffect(() => {
    setArchivePage(1);
  }, [archiveSortMode, searchTerm, selectedSortDirection, showZeroVolumeArchiveEvents]);

  useEffect(() => {
    if (archivePage > archivePageCount) setArchivePage(archivePageCount);
  }, [archivePage, archivePageCount]);

  const renderTickWithDate = (tick, timestamp, tickRef = null) => {
    const explorerRef = tickRef || tick;
    return (
    <Stack spacing={0.15} alignItems="center">
      {tick ? (
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
            fontWeight: 750,
            fontVariantNumeric: "tabular-nums",
            "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
          }}
        >
          {explorerTickOrTxLabel(explorerRef, formatInteger)}
        </Button>
      ) : (
        <Typography variant="body2">-</Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {formatDateUtc(timestamp)}
      </Typography>
    </Stack>
    );
  };

  const renderArchive = () => {
    if (archiveLoading) return renderLoading();
    if (archiveError) {
      return (
          <EmptyState
            title={t("markets.failedArchive")}
            description={archiveError}
            sx={{ color: "error.main" }}
          />
      );
    }

    if (archivedEventsToDisplay.length === 0) {
      return (
          <EmptyState
            title={t("markets.noArchive")}
            description={t("markets.noArchiveHint")}
          />
      );
    }

    const renderOraclePrice = (price) => {
      if (!price?.numerator || !price?.denominator) return "-";
      const value = formatRational(price.numerator, price.denominator, 2);
      if (value === "-") return value;
      return (
        <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
          {value} {price.quoteCurrency || ""}
        </Typography>
      );
    };
    const showOraclePriceColumns = archivedEventsToDisplay.some(
      (event) => event.priceToBeat || event.finalPrice
    );

    const archiveColumns = [
      { key: "event_id", label: "ID", numeric: true, render: (event) => event.event_id },
      {
        key: "event",
        label: t("markets.event"),
        minWidth: 280,
        wrap: true,
        render: (event) => (
          <Stack spacing={0.25} alignItems="flex-start">
            <Button
              size="small"
              variant="text"
              component="a"
              href={`/markets?view=archive&q=${encodeURIComponent(event.event_id || event.description || "")}`}
              onClick={(clickEvent) => {
                if (clickEvent.metaKey || clickEvent.ctrlKey || clickEvent.shiftKey || clickEvent.altKey) return;
                clickEvent.preventDefault();
                updateEventsQuery({ q: String(event.event_id || event.description || "") });
              }}
              sx={{
                minWidth: 0,
                p: 0,
                textTransform: "none",
                textAlign: "left",
                fontWeight: 800,
                color: theme.palette.primary.main,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
              }}
            >
              {event.description || t("markets.eventFallback", { id: event.event_id })}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {event.option0 || t("markets.yes")} | {event.option1 || t("markets.no")}
            </Typography>
          </Stack>
        ),
      },
      {
        key: "winner",
        label: t("markets.winner"),
        render: (event) => <Typography variant="body2" sx={{ fontWeight: 800 }}>{winnerLabel(event, t)}</Typography>,
      },
      { key: "traded_volume", label: t("markets.volume"), numeric: true, render: (event) => formatInteger(event.traded_volume) },
      { key: "created_tick", label: t("markets.createdTick"), numeric: true, render: (event) => renderTickWithDate(event.created_tick, event.created_tx_timestamp) },
      { key: "finalized_tick", label: t("markets.finalizedTick"), numeric: true, render: (event) => renderTickWithDate(event.finalized_tick, event.finalized_tx_timestamp) },
      {
        key: "archived_tick",
        label: t("markets.archivedTick"),
        numeric: true,
        render: (event) => renderTickWithDate(
          event.archived_tick,
          event.archived_tx_timestamp || event.finalized_tx_timestamp || event.result_tx_timestamp,
          event.archived_tick_ref
        ),
      },
      ...(showOraclePriceColumns
        ? [
            {
              key: "price_to_beat",
              label: t("eventDetails.priceToBeat"),
              numeric: true,
              render: (event) => renderOraclePrice(event.priceToBeat),
            },
            {
              key: "final_price",
              label: t("eventDetails.finalPrice"),
              numeric: true,
              render: (event) => renderOraclePrice(event.finalPrice),
            },
          ]
        : []),
    ];

    return (
      <>
        <DataTable
          columns={archiveColumns}
          rows={pagedArchivedEvents}
          emptyText={t("markets.noArchive")}
          minWidth={showOraclePriceColumns ? 1180 : 940}
          getRowKey={(event) => event.event_id}
        />
        {archivedEventsToDisplay.length > PAGE_SIZE && (
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination
              count={archivePageCount}
              page={safeArchivePage}
              onChange={(event, nextPage) => setArchivePage(nextPage)}
              siblingCount={1}
              boundaryCount={1}
              color="primary"
            />
          </Stack>
        )}
      </>
    );
  };

  const isLoadingOverall = loading || isFilterLoading;

  const cardVariants = {
    initial: { y: 8, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { y: 4, opacity: 0, transition: { duration: 0.15, ease: "easeInOut" } },
  };

  return (
      <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pb: { xs: 6, md: 10 } }}>
        <PageShell bottom={0}>
          <Stack spacing={3} sx={{ mb: { xs: 3, md: 4 } }}>
            <PageHeader
              eyebrow={t("markets.eyebrow")}
              title={t("markets.title")}
              description={t("markets.description")}
              icon={<EventAvailableIcon />}
              actions={(
                  <ActionIconButton
                    label={t("markets.refresh")}
                    aria-label={t("markets.refresh")}
                    onClick={handleRefresh}
                    disabled={isLoadingOverall}
                  >
                    <RefreshIcon fontSize="small" />
                  </ActionIconButton>
              )}
              sx={{ mb: 0 }}
            />

            <MetricGrid
              metrics={marketMetrics}
              columns={{ xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }}
              gap={1.5}
            />

            <Tabs
                value={selectedView}
                onChange={handleViewChange}
                sx={{
                  minHeight: 42,
                  borderBottom: `1px solid ${theme.palette.border.soft}`,
                  "& .MuiTab-root": {
                    minHeight: 42,
                    px: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    alignItems: "flex-start",
                  },
                }}
            >
              <Tab value={EVENT_VIEW.ACTIVE} label={t("markets.active")} />
              <Tab value={EVENT_VIEW.ARCHIVE} label={t("markets.archive", { count: archivedEvents.length || 0 })} />
            </Tabs>
          </Stack>

          {selectedView === EVENT_VIEW.ACTIVE && !isConnected ? (
              <EmptyState
                title={t("markets.connectTitle")}
                description={t("markets.connectDescription")}
              />
          ) : selectedView === EVENT_VIEW.ARCHIVE ? (
              <>
                <Box sx={{
                  mb: 3,
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.border.soft}`,
                  bgcolor: theme.palette.surface[1],
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ModernSearchFilter searchTerm={searchTerm} onSearchChange={handleSearchChange} />
                    </Box>
                    <Button
                        onClick={handleSortMenuOpen}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 1,
                          minHeight: 38,
                          px: 1.5,
                          textTransform: "none",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                    >
                      {t("markets.sort", { value: t(SORT_LABEL_KEYS[archiveSortMode]) })}
                    </Button>
                  </Box>
                  <Menu
                      anchorEl={sortMenuAnchorEl}
                      open={Boolean(sortMenuAnchorEl)}
                      onClose={handleSortMenuClose}
                      PaperProps={{
                        sx: {
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.border.default}`,
                          borderRadius: 1.5,
                        },
                      }}
                  >
                    {sortOptions.map((sortMode) => (
                        <MenuItem
                            key={sortMode}
                            selected={archiveSortMode === sortMode}
                            onClick={() => handleSortChange(sortMode)}
                        >
                          {t(SORT_LABEL_KEYS[sortMode])}
                        </MenuItem>
                    ))}
                  </Menu>
                  {[SORT_MODES.CREATED_DATE, SORT_MODES.ARCHIVED_DATE].includes(archiveSortMode) && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.25, justifyContent: "flex-end" }}>
                      {[SORT_DIRECTIONS.DESC, SORT_DIRECTIONS.ASC].map((direction) => (
                        <Button
                          key={direction}
                          size="small"
                          variant={selectedSortDirection === direction ? "contained" : "outlined"}
                          onClick={() => updateEventsQuery({ dir: direction })}
                          sx={{
                            borderRadius: 1,
                            minHeight: 30,
                            px: 1.25,
                            textTransform: "none",
                            fontWeight: 800,
                          }}
                        >
                          {t(SORT_DIRECTION_LABEL_KEYS[direction])}
                        </Button>
                      ))}
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                    <FormControlLabel
                      control={(
                        <Checkbox
                          size="small"
                          checked={showZeroVolumeArchiveEvents}
                          onChange={(event) => setShowZeroVolumeArchiveEvents(event.target.checked)}
                          sx={{
                            py: 0.25,
                            color: "text.secondary",
                            "&.Mui-checked": { color: theme.palette.primary.main },
                          }}
                        />
                      )}
                      label={t("markets.showZero")}
                      sx={{
                        m: 0,
                        color: "text.secondary",
                        "& .MuiFormControlLabel-label": { fontSize: "0.875rem", fontWeight: 650 },
                      }}
                    />
                  </Stack>
                </Box>
                {renderArchive()}
              </>
          ) : (
              <>
                <Box sx={{
                  mb: 3,
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.border.soft}`,
                  bgcolor: theme.palette.surface[1],
                }}>
                  <ModernSearchFilter searchTerm={searchTerm} onSearchChange={handleSearchChange} />
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 2, flexWrap: "wrap" }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {groupOptions.map((group) => {
                        const selected = selectedGroupId === group.id;
                        return (
                            <Button
                                key={group.id}
                                onClick={() => handleGroupChange(group.id)}
                                variant={selected ? "contained" : "text"}
                                size="small"
                                sx={{
                                  borderRadius: 1,
                                  minHeight: 34,
                                  px: 1.5,
                                  textTransform: "none",
                                  fontWeight: 800,
                                  color: selected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
                                  border: selected ? "none" : `1px solid ${theme.palette.border.soft}`,
                                  bgcolor: selected ? theme.palette.primary.main : theme.palette.surface[2],
                                  "&:hover": {
                                    bgcolor: selected ? theme.palette.primary.dark : theme.palette.surface[3],
                                    color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                  },
                                }}
                            >
                              {group.label}
                              <Box component="span" sx={{ ml: 0.75, opacity: 0.7 }}>{eventCounts[group.id] || 0}</Box>
                            </Button>
                        );
                      })}
                    </Stack>
                    <Button
                        onClick={handleSortMenuOpen}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: 1,
                          minHeight: 34,
                          px: 1.5,
                          textTransform: "none",
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                    >
                      {t("markets.sort", { value: t(SORT_LABEL_KEYS[activeSortMode]) })}
                    </Button>
                    <Menu
                        anchorEl={sortMenuAnchorEl}
                        open={Boolean(sortMenuAnchorEl)}
                        onClose={handleSortMenuClose}
                        PaperProps={{
                          sx: {
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.border.default}`,
                            borderRadius: 1.5,
                          },
                        }}
                    >
                      {sortOptions.map((sortMode) => (
                          <MenuItem
                              key={sortMode}
                              selected={activeSortMode === sortMode}
                              onClick={() => handleSortChange(sortMode)}
                          >
                            {t(SORT_LABEL_KEYS[sortMode])}
                          </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                </Box>

                {isLoadingOverall ? renderLoading() : (
                    <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, alignItems: "flex-start", mb: { xs: 4, md: 6 }, flexDirection: { xs: "column", md: "row" } }}>
                      <Box
                          component="aside"
                          sx={{
                            width: { xs: "100%", md: 230 },
                            flexShrink: 0,
                            p: 1,
                            borderRadius: 1.5,
                            border: `1px solid ${theme.palette.border.soft}`,
                            bgcolor: theme.palette.surface[1],
                            position: { md: "sticky" },
                            top: { md: 84 },
                          }}
                      >
                        <Stack spacing={0.5} sx={{ width: "100%" }}>
                          {sidebarItems.map((item) => {
                            const itemId = item.id === "" ? "" : String(item.id);
                            const selected = item.type !== "group" && String(selectedTopicId) === itemId;
                            const count = item.type === "group"
                                ? eventCounts[item.id]
                                : item.id === ""
                                    ? (selectedGroupId === "all" ? eventCounts.all : eventCounts[selectedGroupId])
                                    : eventCounts[item.id];
                            const isExpanded = item.type === "group" && Boolean(expandedGroupIds[item.id]);

                            return (
                                <Box
                                    key={`${item.type}-${itemId || "all-topics"}`}
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns: "minmax(0, 1fr) 42px 28px",
                                      alignItems: "center",
                                      minWidth: "100%",
                                      borderRadius: 1,
                                      bgcolor: selected ? theme.palette.primary.main : "transparent",
                                      color: selected ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                      pl: item.nested ? 1.5 : 0,
                                      "&:hover": {
                                        bgcolor: selected ? theme.palette.primary.dark : theme.palette.surface[2],
                                      },
                                    }}
                                >
                                  <Box
                                      component="button"
                                      type="button"
                                      onClick={() => handleSidebarItemClick(item)}
                                      sx={{
                                        gridColumn: item.type === "group" ? "1 / 3" : "1 / 4",
                                        display: "grid",
                                        gridTemplateColumns: item.type === "group" ? "minmax(0, 1fr) 42px" : "minmax(0, 1fr) 42px 28px",
                                        alignItems: "center",
                                        width: "100%",
                                        minHeight: 32,
                                        px: 1.25,
                                        border: 0,
                                        bgcolor: "transparent",
                                        color: "inherit",
                                        font: "inherit",
                                        fontSize: "0.86rem",
                                        lineHeight: 1.2,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                  >
                                    <Box component="span" sx={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      pr: 1,
                                      fontWeight: item.type === "group" ? 800 : 650,
                                      color: selected ? "inherit" : theme.palette.text.secondary,
                                    }}>
                                      {item.label}
                                    </Box>
                                    <Box component="span" sx={{ opacity: 0.65, textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem" }}>
                                      {count || 0}
                                    </Box>
                                    {item.type !== "group" && <Box component="span" />}
                                  </Box>
                                  {item.type === "group" && (
                                      <IconButton
                                          aria-label={t(isExpanded ? "markets.collapse" : "markets.expand", { label: item.label })}
                                          size="small"
                                          onClick={() => toggleGroupExpansion(item.id)}
                                          sx={{ color: theme.palette.text.secondary, width: 26, height: 26 }}
                                      >
                                        {isExpanded ? <KeyboardArrowDownIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />}
                                      </IconButton>
                                  )}
                                </Box>
                            );
                          })}
                        </Stack>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                        {eventsToDisplay.length > 0 ? (
                            <Grid container spacing={{ xs: 2, sm: 2.25, md: 2.5 }} alignItems="stretch">
                              <AnimatePresence>
                                {eventsToDisplay.map((event, index) => {
                                  const stableKey = event?.eid ?? `evt-${index}`;
                                  return (
                                      <Grid item xs={12} sm={6} lg={4} key={stableKey} component={motion.div} variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: "flex" }}>
                                        <EventOverviewCard
                                            eventUrl={`/market/${event.eid}`}
                                            data={{
                                              ...event,
                                              desc: event.desc,
                                              tradedVolume: eventVolumes[getEventId(event)] ?? 0,
                                              openOrderVolume: eventOpenOrderVolumes[getEventId(event)] ?? 0,
                                              probability: eventProbabilities[getEventId(event)],
                                              priceToBeat: eventPriceToBeat[getEventId(event)],
                                            }}
                                            onClick={() => navigate(`/market/${event.eid}`, { state: { from: eventsReturnPath } })}
                                            status={event.status}
                                            onTxBroadcast={trackTx}
                                        />
                                      </Grid>
                                  );
                                })}
                              </AnimatePresence>
                            </Grid>
                        ) : (
                            <EmptyState
                              title={t("markets.noMarkets")}
                              description={t("markets.noMarketsHint")}
                            />
                        )}
                      </Box>
                    </Box>
                )}
              </>
          )}
        </PageShell>
      </Box>
  );
}

export default EventsPage;
