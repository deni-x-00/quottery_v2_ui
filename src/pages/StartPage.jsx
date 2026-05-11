import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Box,
  useTheme,
  Grid,
  Stack,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { Typewriter } from "react-simple-typewriter";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBars from "../components/qubic/ui/AnimateBars";
import EventOverviewCard from "../components/EventOverviewCard";
import { useConfig } from "../contexts/ConfigContext";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useTxTracker } from "../hooks/useTxTracker";
import { fetchFullOrderbook } from "../components/qubic/util/bobApi";

const RECENT_EVENT_LIMIT = 6;
const HOTTEST_EVENT_LIMIT = 6;
const HOTTEST_CONCURRENCY = 4;

const flattenOrderbook = (book) => [
  ...(book?.option0?.bids || []),
  ...(book?.option0?.asks || []),
  ...(book?.option1?.bids || []),
  ...(book?.option1?.asks || []),
];

const getOrderbookStats = (book) => {
  const orders = flattenOrderbook(book);
  return orders.reduce((stats, order) => {
    const amount = Number(order?.amount || 0);
    const price = Number(order?.price || 0);
    if (!Number.isFinite(amount) || amount <= 0) return stats;

    return {
      orderCount: stats.orderCount + 1,
      shareVolume: stats.shareVolume + amount,
      quoteVolume: stats.quoteVolume + (Number.isFinite(price) && price > 0 ? amount * price : 0),
    };
  }, { orderCount: 0, shareVolume: 0, quoteVolume: 0 });
};

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function StartPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isConnected, bobUrl } = useConfig();
  const { allEvents, loading, fetchEvents } = useQuotteryContext();
  const { trackTx } = useTxTracker();
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [activeSection, setActiveSection] = useState("recent");
  const [isLoadingHottest, setIsLoadingHottest] = useState(false);
  const [hottestEvents, setHottestEvents] = useState([]);
  const [hottestLoaded, setHottestLoaded] = useState(false);

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

  useEffect(() => {
    setHottestLoaded(false);
    setHottestEvents([]);
  }, [allEvents]);

  const recentEvents = useMemo(() => (
      [...(Array.isArray(allEvents) ? allEvents : [])]
          .sort((a, b) => Number(b?.eid ?? b?.eventId ?? 0) - Number(a?.eid ?? a?.eventId ?? 0))
          .slice(0, RECENT_EVENT_LIMIT)
  ), [allEvents]);

  const loadHottestEvents = async () => {
    if (hottestLoaded || isLoadingHottest) return;

    const events = Array.isArray(allEvents) ? allEvents : [];
    if (!bobUrl || events.length === 0) return;

    setIsLoadingHottest(true);
    try {
      const scoredEvents = await mapWithConcurrency(events, HOTTEST_CONCURRENCY, async (event) => {
        const eid = event?.eid ?? event?.eventId;
        if (eid === undefined || eid === null) return null;

        try {
          const book = await fetchFullOrderbook(bobUrl, eid);
          const hotStats = getOrderbookStats(book);
          if (hotStats.orderCount === 0) return null;

          return {
            ...event,
            hotStats,
            hotScore: hotStats.quoteVolume || hotStats.shareVolume || hotStats.orderCount,
          };
        } catch (e) {
          console.warn(`Failed to fetch hottest stats for event ${eid}:`, e);
          return null;
        }
      });

      setHottestEvents(
          scoredEvents
              .filter(Boolean)
              .sort((a, b) =>
                  Number(b.hotScore || 0) - Number(a.hotScore || 0) ||
                  Number(b.hotStats?.orderCount || 0) - Number(a.hotStats?.orderCount || 0)
              )
              .slice(0, HOTTEST_EVENT_LIMIT)
      );
      setHottestLoaded(true);
    } finally {
      setIsLoadingHottest(false);
    }
  };

  const showHottest = async () => {
    setActiveSection("hottest");
    await loadHottestEvents();
  };

  const visibleEvents = activeSection === "hottest" ? hottestEvents : recentEvents;
  const sectionTitle = activeSection === "hottest" ? "Hottest Events" : "Recent Events";
  const isLoadingOverall = loading || isLoadingEvents || (activeSection === "hottest" && isLoadingHottest);

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
                    {sectionTitle}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ justifySelf: "end" }}>
                    <Button
                        size="small"
                        variant={activeSection === "hottest" ? "contained" : "text"}
                        startIcon={<LocalFireDepartmentIcon />}
                        onClick={activeSection === "hottest" ? () => setActiveSection("recent") : showHottest}
                        disabled={isLoadingHottest || isLoadingOverall}
                        sx={{ borderRadius: 1, textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      {activeSection === "hottest" ? "Recent" : "Hottest"}
                    </Button>
                    <Button component={RouterLink} to="/events" size="small" variant="text" sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}>
                      All Events
                    </Button>
                  </Stack>
                </Box>

                {isLoadingOverall ? (
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
                      <AnimatedBars />
                      <Typography variant="h6" color="text.secondary">
                        {activeSection === "hottest" ? "Scanning order books..." : "Loading events, please wait..."}
                      </Typography>
                    </Box>
                ) : visibleEvents.length > 0 ? (
                    <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent="center" alignItems="stretch">
                      <AnimatePresence>
                        {visibleEvents.map((event, index) => {
                          const stableKey = event?.eid ?? `evt-${index}`;
                          return (
                              <Grid item xs={12} sm={6} md={4} key={stableKey} component={motion.div} variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: "flex" }}>
                                <EventOverviewCard
                                    data={{ ...event, desc: event.desc }}
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
                        {activeSection === "hottest" ? "No open order activity found." : "No events found."}
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
