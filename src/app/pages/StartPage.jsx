import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Box,
  useTheme,
  Grid,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { motion, AnimatePresence } from "framer-motion";
import EventOverviewCard from "../components/EventOverviewCard";
import { EmptyState, LoadingSkeleton, PAGE_GUTTER_X, PAGE_MAX_WIDTH } from "../components/ui";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useTxTracker } from "../hooks/useTxTracker";
import usePageTitle from "../hooks/usePageTitle";
import { fetchCachedEventVolumes, fetchEventVolumesByIds, getEventId } from "../utils/eventVolumes";
import { useTranslation } from "react-i18next";

const RECENT_EVENT_LIMIT = 6;
const EVENT_METRICS_REFRESH_MS = 15000;

function StartPage() {
  usePageTitle();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { bobUrl, isConnected } = useConfig();
  const { allEvents, loading, fetchEvents } = useQuotteryContext();
  const { trackTx } = useTxTracker();
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventVolumes, setEventVolumes] = useState({});
  const [eventOpenOrderVolumes, setEventOpenOrderVolumes] = useState({});
  const [eventProbabilities, setEventProbabilities] = useState({});

  useEffect(() => {
    if (!isConnected) return;
    const loadEvents = async () => {
      setIsLoadingEvents(true);
      try {
        await fetchEvents();
      } finally {
        setIsLoadingEvents(false);
      }
    };
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const recentEvents = useMemo(() => (
      [...(Array.isArray(allEvents) ? allEvents : [])]
          .sort((a, b) => Number(b?.eid ?? b?.eventId ?? 0) - Number(a?.eid ?? a?.eventId ?? 0))
          .slice(0, RECENT_EVENT_LIMIT)
  ), [allEvents]);

  useEffect(() => {
    if (!isConnected || recentEvents.length === 0) {
      setEventVolumes({});
      setEventOpenOrderVolumes({});
      setEventProbabilities({});
      return undefined;
    }

    const controller = new AbortController();
    const mergeVolumes = (volumes) => {
      setEventVolumes((prev) => ({ ...prev, ...(volumes || {}) }));
    };
    const mergeOpenOrderVolumes = (volumes) => {
      setEventOpenOrderVolumes((prev) => ({ ...prev, ...(volumes || {}) }));
    };
    const mergeProbabilities = (probabilities) => {
      setEventProbabilities((prev) => ({ ...prev, ...(probabilities || {}) }));
    };

    const loadVolumes = async () => {
      try {
        const firstResult = await fetchCachedEventVolumes(bobUrl, recentEvents, controller.signal);
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
          console.warn("[StartPage] Failed to load cached event volumes:", error.message);
        }
      }
    };

    loadVolumes();
    const intervalId = setInterval(loadVolumes, EVENT_METRICS_REFRESH_MS);
    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [bobUrl, isConnected, recentEvents]);

  const isLoadingOverall = loading || isLoadingEvents;

  const cardVariants = {
    initial: { scale: 0.7, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 12, mass: 0.7 } },
    exit: { scale: 0.7, opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
      <Box sx={{
        minHeight: "100vh",
        background: theme.palette.background.default,
        pt: { xs: 10, sm: 12, md: 16 },
        pb: { xs: 6, sm: 8, md: 10 },
        overflow: "hidden",
      }}>
        <Box sx={{ width: "100%", maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: PAGE_GUTTER_X }}>
          <Box component="header" sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            mb: { xs: 4, sm: 5, md: 6 },
            mt: { xs: -2, sm: -3, md: -5 },
            textAlign: "left",
            maxWidth: 860,
          }}>
            <Typography
              component={motion.p}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              sx={{
                m: 0,
                mb: 1.5,
                color: "primary.main",
                fontSize: "0.76rem",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {t("home.eyebrow")}
            </Typography>
            <Typography
                variant="h2"
                fontWeight="bold"
                gutterBottom
                component={motion.h2}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                color="text.primary"
                sx={{
                  fontSize: { xs: "3rem", sm: "4rem", md: "5.2rem" },
                  lineHeight: 0.95,
                  letterSpacing: "-0.035em",
                  mt: 0,
                  mb: 2,
                  maxWidth: 760,
                }}
            >
              {t("home.titleStart")}{" "}
              <Box component="span" sx={{ color: "primary.main", fontSize: "inherit" }} fontWeight="bold">
                {t("home.titleAccent")}
              </Box>
            </Typography>
            <Typography
                color="text.secondary"
                gutterBottom
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.45 }}
                sx={{
                  maxWidth: 680,
                  fontSize: { xs: "1rem", sm: "1.12rem", md: "1.25rem" },
                  fontWeight: 500,
                  lineHeight: 1.55,
                }}
            >
              {t("home.description")}
            </Typography>
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 1.25,
              width: "100%",
              maxWidth: 680,
              mt: { xs: 2.5, sm: 3 },
            }}>
              {[
                ["whole-share", t("home.wholeShare"), "100,000 GARTH"],
                ["settlement", t("home.settlement"), t("home.settlementValue")],
                ["data", t("home.data"), t("home.dataValue")],
              ].map(([key, label, value]) => (
                <Box
                  key={key}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.border.soft}`,
                    bgcolor: theme.palette.surface[1],
                  }}
                >
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontWeight: 800 }}>
                    {label}
                  </Typography>
                  <Typography className="stat" sx={{ mt: 0.5, fontWeight: 900, color: "text.primary" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-start", mt: { xs: 2.5, sm: 3 } }}>
              <Button
                  component={RouterLink}
                  to="/markets"
                  startIcon={<EventAvailableIcon />}
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900, minHeight: 44 }}
              >
                {t("home.explore")}
              </Button>
              <Button
                  onClick={() => navigate("/about")}
                  startIcon={<InfoOutlinedIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 1, textTransform: "none", fontWeight: 900, minHeight: 44 }}
              >
                {t("home.about")}
              </Button>
            </Box>
          </Box>

          {isConnected && (
              <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 2, mb: 2.5 }}>
                  <Box />
                  <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                    {t("home.recent")}
                  </Typography>
                  <Button component={RouterLink} to="/markets" size="small" variant="text" sx={{ justifySelf: "end", textTransform: "none", fontWeight: 700 }}>
                    {t("home.all")}
                  </Button>
                </Box>

                {isLoadingOverall ? (
                    <LoadingSkeleton variant="cards" cards={3} />
                ) : recentEvents.length > 0 ? (
                    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center" alignItems="stretch">
                      <AnimatePresence>
                        {recentEvents.map((event, index) => {
                          const stableKey = event?.eid ?? `evt-${index}`;
                          return (
                              <Grid item xs={12} sm={6} md={4} key={stableKey} component={motion.div} variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: "flex" }}>
                                <EventOverviewCard
                                    eventUrl={`/market/${event.eid}`}
                                    data={{
                                      ...event,
                                      desc: event.desc,
                                      tradedVolume: eventVolumes[getEventId(event)] ?? 0,
                                      openOrderVolume: eventOpenOrderVolumes[getEventId(event)] ?? 0,
                                      probability: eventProbabilities[getEventId(event)],
                                    }}
                                    onClick={() => navigate(`/market/${event.eid}`, { state: { from: "/" } })}
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
                      compact
                      title={t("home.emptyTitle")}
                      description={t("home.emptyDescription")}
                    />
                )}
              </Box>
          )}
        </Box>
      </Box>
  );
}

export default StartPage;
