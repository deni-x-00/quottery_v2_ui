import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
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
import { TAG_GROUPS, getAllTags, getCanonicalTagId, getTagGroupId, getTagIdBySlug, getTagSlug, getTagsForGroup } from "../components/qubic/util/tagMap";
import { isEventClosed, parseQubicUtcDate } from "../components/qubic/util/tradeValidation";

const SORT_MODES = {
  NEWEST: "newest",
  ENDING_SOON: "ending-soon",
};

const SORT_LABELS = {
  [SORT_MODES.NEWEST]: "Newest",
  [SORT_MODES.ENDING_SOON]: "Ending soon",
};

const getValidSortMode = (sortMode) => (
    sortMode === SORT_MODES.NEWEST ? SORT_MODES.NEWEST : SORT_MODES.ENDING_SOON
);

const isValidGroupId = (groupId) => (
  groupId === "all" || TAG_GROUPS.some((group) => group.id === groupId)
);

const getValidGroupId = (groupId) => (
  isValidGroupId(groupId) ? groupId : "all"
);

const getValidTopicId = (topicId) => {
  if (topicId === null || topicId === undefined || topicId === "") return "";
  const topicValue = String(topicId).trim();

  if (/^\d+$/.test(topicValue)) {
    const id = Number(topicValue);
    if (!Number.isFinite(id) || id <= 0) return "";
    return getAllTags().some((tag) => tag.id === id) ? String(id) : "";
  }

  const id = getTagIdBySlug(topicValue);
  return id > 0 ? String(id) : "";
};

function EventsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const { isConnected } = useConfig();
  const { allEvents, loading, fetchEvents } = useQuotteryContext();
  const { trackTx } = useTxTracker();
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState({});
  const selectedTopicId = getValidTopicId(searchParams.get("topic"));
  const selectedGroupId = selectedTopicId
      ? getTagGroupId(Number(selectedTopicId))
      : getValidGroupId(searchParams.get("group"));
  const selectedSortMode = getValidSortMode(searchParams.get("sort"));
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
    setIsFilterLoading(true);
    try {
      await fetchEvents();
    } finally {
      setIsFilterLoading(false);
    }
  };

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
    const sortEvents = (events) => {
      if (selectedSortMode === SORT_MODES.ENDING_SOON) {
        const now = new Date();
        return [...events].sort((a, b) => {
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

          return Number(b?.eid ?? b?.eventId ?? 0) - Number(a?.eid ?? a?.eventId ?? 0);
        });
      }

      return [...events].sort((a, b) => Number(b?.eid ?? b?.eventId ?? 0) - Number(a?.eid ?? a?.eventId ?? 0));
    };

    if (selectedTopicId) {
      const topicId = Number(selectedTopicId);
      return sortEvents(baseEventsToDisplay.filter((event) => getCanonicalTagId(event.tag) === topicId));
    }
    if (selectedGroupId === "all") return sortEvents(baseEventsToDisplay);
    return sortEvents(baseEventsToDisplay.filter((event) => getTagGroupId(event.tag) === selectedGroupId));
  }, [baseEventsToDisplay, selectedGroupId, selectedSortMode, selectedTopicId]);

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
      const nextTopicId = getValidTopicId(updates.topic);
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
      if (nextSortMode === SORT_MODES.ENDING_SOON) {
        nextParams.delete("sort");
      } else {
        nextParams.set("sort", nextSortMode);
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

  const handleSortToggle = React.useCallback(() => {
    updateEventsQuery({
      sort: selectedSortMode === SORT_MODES.ENDING_SOON ? SORT_MODES.NEWEST : SORT_MODES.ENDING_SOON,
    });
  }, [selectedSortMode, updateEventsQuery]);
  const nextSortMode = selectedSortMode === SORT_MODES.ENDING_SOON
      ? SORT_MODES.NEWEST
      : SORT_MODES.ENDING_SOON;

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

          {!isConnected ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="text.secondary">Connect your wallet to browse events.</Typography>
              </Box>
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
                        onClick={handleSortToggle}
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
                      Sort by {SORT_LABELS[nextSortMode]}
                    </Button>
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
                                            data={{ ...event, desc: event.desc }}
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
