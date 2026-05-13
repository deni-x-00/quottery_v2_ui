import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Box,
  useTheme,
  Grid,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { Typewriter } from "react-simple-typewriter";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBars from "../components/qubic/ui/AnimateBars";
import EventOverviewCard from "../components/EventOverviewCard";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useTxTracker } from "../hooks/useTxTracker";
import { fetchCachedEventVolumes, fetchEventVolumesByIds, getEventId } from "../utils/eventVolumes";

const RECENT_EVENT_LIMIT = 6;

function StartPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { bobUrl, isConnected } = useConfig();
  const { allEvents, loading, fetchEvents } = useQuotteryContext();
  const { trackTx } = useTxTracker();
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventVolumes, setEventVolumes] = useState({});

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
      return undefined;
    }

    const controller = new AbortController();
    const mergeVolumes = (volumes) => {
      setEventVolumes((prev) => ({ ...prev, ...(volumes || {}) }));
    };

    const loadVolumes = async () => {
      try {
        const firstResult = await fetchCachedEventVolumes(bobUrl, recentEvents, controller.signal);
        mergeVolumes(firstResult.volumes);

        let deferredEventIds = firstResult.deferredEventIds || [];
        while (deferredEventIds.length > 0 && !controller.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          if (controller.signal.aborted) return;

          const nextResult = await fetchEventVolumesByIds(bobUrl, deferredEventIds, controller.signal);
          mergeVolumes(nextResult.volumes);
          deferredEventIds = nextResult.deferredEventIds || [];
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("[StartPage] Failed to load cached event volumes:", error.message);
        }
      }
    };

    loadVolumes();
    return () => controller.abort();
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
        <Container maxWidth="lg">
          <Box component="header" sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: { xs: 4, sm: 5, md: 6 },
            mt: { xs: -2, sm: -3, md: -5 },
            textAlign: "center",
          }}>
            <Typography
                variant="h2"
                fontWeight="bold"
                gutterBottom
                component={motion.h2}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                color="text.primary"
                sx={{ fontSize: { xs: "2.7rem", sm: "3rem", md: "3.5rem", lg: "3.5rem" }, lineHeight: 1.2, mt: 3 }}
            >
              Predict To{" "}
              <Box component="span" sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                px: { xs: 0.5, sm: 1 },
                fontSize: "inherit",
              }} fontWeight="bold">
                Profit.
              </Box>
            </Typography>
            <Typography
                color="text.secondary"
                gutterBottom
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.3rem", lg: "1.5rem" }, mx: "auto", fontWeight: 500 }}
            >
              <Typewriter
                  words={["P2P prediction market powered by Qubic. Safe, Secure, and Exciting"]}
                  loop={1}
                  cursor
                  cursorStyle="_"
                  typeSpeed={33}
                  deleteSpeed={50}
                  delaySpeed={1000}
              />
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center", mt: { xs: 2, sm: 3 } }}>
              <Button
                  component={RouterLink}
                  to="/events"
                  startIcon={<EventAvailableIcon />}
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: 1, textTransform: "none", fontWeight: 700 }}
              >
                All Events
              </Button>
              <Button
                  onClick={() => navigate("/about")}
                  startIcon={<InfoOutlinedIcon />}
                  variant="outlined"
                  color="primary"
                  sx={{ borderRadius: 1, textTransform: "none", fontWeight: 700 }}
              >
                About
              </Button>
            </Box>
          </Box>

          {isConnected && (
              <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 2, mb: 2.5 }}>
                  <Box />
                  <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}>
                    Recent Events
                  </Typography>
                  <Button component={RouterLink} to="/events" size="small" variant="text" sx={{ justifySelf: "end", textTransform: "none", fontWeight: 700 }}>
                    All Events
                  </Button>
                </Box>

                {isLoadingOverall ? (
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
                      <AnimatedBars />
                      <Typography variant="h6" color="text.secondary">Loading events, please wait...</Typography>
                    </Box>
                ) : recentEvents.length > 0 ? (
                    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center" alignItems="stretch">
                      <AnimatePresence>
                        {recentEvents.map((event, index) => {
                          const stableKey = event?.eid ?? `evt-${index}`;
                          return (
                              <Grid item xs={12} sm={6} md={4} key={stableKey} component={motion.div} variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: "flex" }}>
                                <EventOverviewCard
                                    data={{ ...event, desc: event.desc, volume: eventVolumes[getEventId(event)] ?? 0 }}
                                    onClick={() => navigate(`/event/${event.eid}`, { state: { from: "/" } })}
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
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                        No events found.
                      </Typography>
                    </Box>
                )}
              </Box>
          )}
        </Container>
      </Box>
  );
}

export default StartPage;
