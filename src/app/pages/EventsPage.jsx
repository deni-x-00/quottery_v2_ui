import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  Menu,
  MenuItem,
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
  useTheme,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AnimatePresence, motion } from "framer-motion";
import ModernSearchFilter from "../components/SearchFilter";
import AnimatedBars from "../components/qubic/ui/AnimateBars";
import EventOverviewCard from "../components/EventOverviewCard";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useTxTracker } from "../hooks/useTxTracker";
import usePageTitle from "../hooks/usePageTitle";
import { TAG_GROUPS, getAllTags, getCanonicalTagId, getTagGroupId, getTagIdBySlug, getTagSlug, getTagsForGroup } from "../components/qubic/util/tagMap";
import { isEventClosed, parseQubicUtcDate } from "../components/qubic/util/tradeValidation";
import { fetchCachedEventVolumes, fetchEventVolumesByIds, getEventId } from "../utils/eventVolumes";
import { explorerTickOrTxLabel, explorerTickOrTxUrl } from "../utils/explorerLinks";

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

const SORT_LABELS = {
  [SORT_MODES.VOLUME]: "Traded volume",
  [SORT_MODES.OPEN_VOLUME]: "Open orders volume",
  [SORT_MODES.NEWEST]: "Newest",
  [SORT_MODES.ENDING_SOON]: "Ending soon",
  [SORT_MODES.CREATED_DATE]: "Created date",
  [SORT_MODES.ARCHIVED_DATE]: "Archived date",
};
const SORT_DIRECTION_LABELS = {
  [SORT_DIRECTIONS.DESC]: "Newest",
  [SORT_DIRECTIONS.ASC]: "Oldest",
};

const EVENT_VIEW = {
  ACTIVE: "active",
  ARCHIVE: "archive",
};
const PAGE_SIZE = 50;
const EVENT_METRICS_REFRESH_MS = 15000;
const EVENT_METRICS_DUPLICATE_WINDOW_MS = 5000;

const API_BASE = process.env.REACT_APP_QUOTTERY_API_BASE || "";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
      .split(".")[0]
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDateUtc(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const part = (next) => String(next).padStart(2, "0");
  return `${part(date.getUTCMonth() + 1)}/${part(date.getUTCDate())}/${date.getUTCFullYear()}, ${part(date.getUTCHours())}:${part(date.getUTCMinutes())}:${part(date.getUTCSeconds())}`;
}

function winnerLabel(event) {
  if (event?.result === null || event?.result === undefined) return "Pending";
  if (Number(event.result) === 0) return event.option0 || "Yes";
  if (Number(event.result) === 1) return event.option1 || "No";
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
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [archivePage, setArchivePage] = useState(1);
  const [showZeroVolumeArchiveEvents, setShowZeroVolumeArchiveEvents] = useState(false);
  const lastImmediateMetricsRef = useRef({ key: "", at: 0 });
  const requestedGroupId = getValidGroupId(searchParams.get("group"));
  const selectedView = searchParams.get("view") === EVENT_VIEW.ARCHIVE ? EVENT_VIEW.ARCHIVE : EVENT_VIEW.ACTIVE;
  usePageTitle(selectedView === EVENT_VIEW.ARCHIVE ? "Archived events" : "Events");
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

  const loadArchivedEvents = React.useCallback(async () => {
    setArchiveLoading(true);
    setArchiveError("");
    try {
      const response = await fetch(apiUrl("/api/quottery/events?status=archived&limit=1000"));
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.details || body?.error || `Request failed with ${response.status}`);
      setArchivedEvents(Array.isArray(body.events) ? body.events : []);
    } catch (error) {
      setArchiveError(error.message || "Failed to load archived events");
      setArchivedEvents([]);
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchivedEvents();
  }, [loadArchivedEvents]);

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

        let deferredEventIds = firstResult.deferredEventIds || [];
        while (deferredEventIds.length > 0 && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (controller.signal.aborted) return;

          const nextResult = await fetchEventVolumesByIds(bobUrl, deferredEventIds, controller.signal);
          mergeVolumes(nextResult.volumes);
          mergeOpenOrderVolumes(nextResult.openOrderVolumes);
          mergeProbabilities(nextResult.probabilities);
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
    { id: "all", label: "All" },
    ...TAG_GROUPS,
  ], []);

  const sidebarItems = React.useMemo(() => {
    if (selectedGroupId === "all") {
      const items = [{ type: "all", id: "", label: "All Events" }];

      for (const group of TAG_GROUPS) {
        items.push({ type: "group", id: group.id, label: group.label });
        if (expandedGroupIds[group.id]) {
          items.push(
              ...getTagsForGroup(group.id).map((tag) => ({
                type: "tag",
                groupId: group.id,
                nested: true,
                ...tag,
              }))
          );
        }
      }

      return items;
    }

    return [
      { type: "all", id: "", label: `All ${groupOptions.find((group) => group.id === selectedGroupId)?.label || "Events"}` },
      ...getTagsForGroup(selectedGroupId).map((tag) => ({ type: "tag", groupId: selectedGroupId, ...tag })),
    ];
  }, [expandedGroupIds, groupOptions, selectedGroupId]);

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

  const renderLoading = () => (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
        <AnimatedBars />
        <Typography variant="h6" color="text.secondary">Loading events, please wait...</Typography>
      </Box>
  );

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
          {explorerTickOrTxLabel(explorerRef, formatAmount)}
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
          <Box sx={{ textAlign: "center", py: 6, color: "error.main" }}>
            <Typography>{archiveError}</Typography>
          </Box>
      );
    }

    if (archivedEventsToDisplay.length === 0) {
      return (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>No archived events found.</Typography>
          </Box>
      );
    }

    return (
      <>
        <Paper elevation={0} variant="outlined" sx={{ overflowX: "auto", borderRadius: 2 }}>
          <Table size="small" sx={{ minWidth: 940 }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 280 }}>Event</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Winner</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Volume</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Created tick</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Finalized tick</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Archived tick</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedArchivedEvents.map((event) => (
                  <TableRow key={event.event_id}>
                    <TableCell align="center">{event.event_id}</TableCell>
                    <TableCell sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
                      <Button
                        size="small"
                        variant="text"
                        component="a"
                        href={`/events?view=archive&q=${encodeURIComponent(event.event_id || event.description || "")}`}
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
                          fontWeight: 650,
                          color: theme.palette.primary.main,
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                        }}
                      >
                        {event.description || `Event #${event.event_id}`}
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        {event.option0 || "Yes"} | {event.option1 || "No"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{winnerLabel(event)}</Typography>
                    </TableCell>
                    <TableCell align="center">{formatAmount(event.traded_volume)}</TableCell>
                    <TableCell align="center">{renderTickWithDate(event.created_tick, event.created_tx_timestamp)}</TableCell>
                    <TableCell align="center">{renderTickWithDate(event.finalized_tick, event.finalized_tx_timestamp)}</TableCell>
                    <TableCell align="center">{renderTickWithDate(event.archived_tick, event.archived_tx_timestamp || event.finalized_tx_timestamp || event.result_tx_timestamp, event.archived_tick_ref)}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
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
    initial: { scale: 0.7, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 12, mass: 0.7 } },
    exit: { scale: 0.7, opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
      <Box sx={{ minHeight: "100vh", background: theme.palette.background.default, pt: { xs: 5, md: 7 }, pb: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 2, mb: 3 }}>
            <Box />
            <Typography variant="h3" color="text.primary" sx={{ fontWeight: 700, fontSize: { xs: "2rem", md: "2.7rem" } }}>
              Events
            </Typography>
            <Tooltip title="Refresh events">
              <Box component="span" sx={{ justifySelf: "end" }}>
                <IconButton aria-label="refresh events" onClick={handleRefresh} disabled={isLoadingOverall} size="small">
                  <RefreshIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </IconButton>
              </Box>
            </Tooltip>
          </Box>

          <Tabs
              value={selectedView}
              onChange={handleViewChange}
              centered
              sx={{ mb: 3, minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700 } }}
          >
            <Tab value={EVENT_VIEW.ACTIVE} label="Active" />
            <Tab value={EVENT_VIEW.ARCHIVE} label={`Archive (${archivedEvents.length || 0})`} />
          </Tabs>

          {selectedView === EVENT_VIEW.ACTIVE && !isConnected ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="text.secondary">Connect your wallet to browse events.</Typography>
              </Box>
          ) : selectedView === EVENT_VIEW.ARCHIVE ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                    >
                      Sort: {SORT_LABELS[archiveSortMode]}
                    </Button>
                  </Box>
                  <Menu
                      anchorEl={sortMenuAnchorEl}
                      open={Boolean(sortMenuAnchorEl)}
                      onClose={handleSortMenuClose}
                  >
                    {sortOptions.map((sortMode) => (
                        <MenuItem
                            key={sortMode}
                            selected={archiveSortMode === sortMode}
                            onClick={() => handleSortChange(sortMode)}
                        >
                          {SORT_LABELS[sortMode]}
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
                            fontWeight: 700,
                          }}
                        >
                          {SORT_DIRECTION_LABELS[direction]}
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
                      label="Show zero volume events"
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
                <Box sx={{ mb: 3 }}>
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
                                  fontWeight: 700,
                                  color: selected ? theme.palette.primary.contrastText : theme.palette.text.secondary,
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
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                    >
                      Sort: {SORT_LABELS[activeSortMode]}
                    </Button>
                    <Menu
                        anchorEl={sortMenuAnchorEl}
                        open={Boolean(sortMenuAnchorEl)}
                        onClose={handleSortMenuClose}
                    >
                      {sortOptions.map((sortMode) => (
                          <MenuItem
                              key={sortMode}
                              selected={activeSortMode === sortMode}
                              onClick={() => handleSortChange(sortMode)}
                          >
                            {SORT_LABELS[sortMode]}
                          </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                </Box>

                {isLoadingOverall ? renderLoading() : (
                    <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, alignItems: "flex-start", mb: { xs: 4, md: 6 }, flexDirection: { xs: "column", md: "row" } }}>
                      <Box
                          component="aside"
                          sx={{
                            width: { xs: "100%", md: 210 },
                            flexShrink: 0,
                            borderRight: { xs: 0, md: `1px solid ${theme.palette.divider}` },
                            pr: { xs: 0, md: 2 },
                          }}
                      >
                        <Stack spacing={0.5} sx={{ width: "100%", pb: { xs: 1, md: 0 } }}>
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
                                        bgcolor: selected ? theme.palette.primary.main : theme.palette.action.hover,
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
                                      fontWeight: item.type === "group" ? 650 : 500,
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
                                          aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
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
                            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center" alignItems="stretch">
                              <AnimatePresence>
                                {eventsToDisplay.map((event, index) => {
                                  const stableKey = event?.eid ?? `evt-${index}`;
                                  return (
                                      <Grid item xs={12} sm={6} lg={4} key={stableKey} component={motion.div} variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: "flex" }}>
                                        <EventOverviewCard
                                            eventUrl={`/event/${event.eid}`}
                                            data={{
                                              ...event,
                                              desc: event.desc,
                                              tradedVolume: eventVolumes[getEventId(event)] ?? 0,
                                              openOrderVolume: eventOpenOrderVolumes[getEventId(event)] ?? 0,
                                              probability: eventProbabilities[getEventId(event)],
                                            }}
                                            onClick={() => navigate(`/event/${event.eid}`, { state: { from: eventsReturnPath } })}
                                            status={event.status}
                                            onTxBroadcast={trackTx}
                                        />
                                      </Grid>
                                  );
                                })}
                              </AnimatePresence>
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: "center", py: 6 }}>
                              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>No events found.</Typography>
                            </Box>
                        )}
                      </Box>
                    </Box>
                )}
              </>
          )}
        </Container>
      </Box>
  );
}

export default EventsPage;
