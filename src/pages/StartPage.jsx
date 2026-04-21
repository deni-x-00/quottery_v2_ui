import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Container,
  Box,
  useTheme,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import GamepadIcon from "@mui/icons-material/Gamepad";
import RefreshIcon from "@mui/icons-material/Refresh";
import LinkIcon from "@mui/icons-material/Link";
import { useQuotteryContext } from "../contexts/QuotteryContext";
import { useConfig } from "../contexts/ConfigContext";
import { Typewriter } from "react-simple-typewriter";
import { motion, AnimatePresence } from "framer-motion";
import ModernSearchFilter from "../components/SearchFilter";
import AnimatedBars from "../components/qubic/ui/AnimateBars";
import EventOverviewCard from "../components/EventOverviewCard";
import { getAllTags } from "../components/qubic/util/tagMap";
import ServerConnectModal from "../components/qubic/connect/ServerConfigModal";
import { useTxTracker } from "../hooks/useTxTracker";
import connectIcon from "../assets/connect.svg";

function StartPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isConnected } = useConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const { trackTx } = useTxTracker();

  const {
    allEvents,
    loading,
    fetchEvents
  } = useQuotteryContext();

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

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const filteredEvents = (events) => {
    const safeEvents = Array.isArray(events) ? events : [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return safeEvents;

    return safeEvents.filter((event) => {
      const descMatches = (event.desc || "").toLowerCase().includes(term);
      const opt0Matches = (event.option0Desc || "").toLowerCase().includes(term);
      const opt1Matches = (event.option1Desc || "").toLowerCase().includes(term);
      return descMatches || opt0Matches || opt1Matches;
    });
  };

  const baseEventsToDisplay = filteredEvents(allEvents || []);

  const filterOptions = React.useMemo(() => {
    const allTags = getAllTags();
    return [
      { label: "All", value: "" },
      ...allTags
          .filter((t) => t.id > 0)
          .map((t) => ({ label: t.label, value: String(t.id) })),
    ];
  }, []);

  const eventsToDisplay = React.useMemo(() => {
    const safeBaseEvents = Array.isArray(baseEventsToDisplay) ? baseEventsToDisplay : [];
    const selected = filterOptions[selectedTagIndex]?.value;
    if (!selected) return safeBaseEvents;
    const tagId = Number(selected);
    return safeBaseEvents.filter((e) => e.tag === tagId);
  }, [baseEventsToDisplay, filterOptions, selectedTagIndex]);

  const renderLoading = () => (
      <Box sx={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", mt: { xs: 4, sm: 6, md: 8 }, mb: { xs: 4, sm: 6, md: 8 }, gap: 2,
      }}>
        <AnimatedBars />
        <Typography variant='h6' color='text.secondary' textAlign='center' marginTop={2}
                    sx={{ fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" } }}>
          Loading events, please wait...
        </Typography>
      </Box>
  );

  const isLoadingOverall = loading || isFilterLoading;

  const cardVariants = {
    initial: { scale: 0.7, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 12, mass: 0.7 } },
    exit: { scale: 0.7, opacity: 0, transition: { duration: 0.2, ease: "easeInOut" } },
  };

  return (
      <Box sx={{
        minHeight: "100vh", background: theme.palette.background.default,
        pt: { xs: 10, sm: 12, md: 16 }, pb: { xs: 6, sm: 8, md: 10 }, overflow: "hidden",
      }}>
        <Container maxWidth='lg'>
          {/* Header Section */}
          <Box component='header' sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            mb: { xs: 4, sm: 5, md: 6 }, mt: { xs: -2, sm: -3, md: -5 }, textAlign: "center",
          }}>
            <Typography variant='h2' fontWeight='bold' gutterBottom
                        component={motion.h2}
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }} color='text.primary'
                        sx={{ fontSize: { xs: "2.7rem", sm: "3rem", md: "3.5rem", lg: "3.5rem" }, lineHeight: 1.2, mt: 3 }}>
              Predict To{" "}
              <Box component='span' sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.mode === "dark" ? theme.palette.primary.contrastText : theme.palette.background.default,
                px: { xs: 0.5, sm: 1 }, fontSize: "inherit",
              }} fontWeight='bold'>Profit.</Box>
            </Typography>
            <Typography color='text.secondary' gutterBottom fontWeight='bold'
                        component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem", md: "1.3rem", lg: "1.5rem" }, mx: "auto", fontWeight: "500" }}>
              <Typewriter
                  words={["P2P prediction market powered by Qubic. Safe, Secure, and Exciting"]}
                  loop={1} cursor cursorStyle='_' typeSpeed={33} deleteSpeed={50} delaySpeed={1000}
              />
            </Typography>
            {isConnected && (
                <Button onClick={() => navigate("/create")} startIcon={<GamepadIcon />}
                        variant='contained'
                        color={theme.palette.mode === "dark" ? "secondary" : theme.palette.background.paper}
                        component={motion.button}
                        sx={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 10, boxShadow: theme.shadows[1],
                          color: theme.palette.primary.contrastText,
                          "&:focus": { backgroundColor: theme.palette.primary.main },
                          mt: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 0 },
                          py: { xs: 0.5, sm: 1 }, px: { xs: 1.5, sm: 2 },
                          fontSize: { xs: "1rem", sm: "1rem" },
                          "&:hover": {
                            "& .MuiSvgIcon-root": { transform: "rotate(720deg)" },
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.mode === "dark" ? theme.palette.primary.contrastText : "white",
                          },
                          "& .MuiSvgIcon-root": { transition: "transform 0.5s" },
                          textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "bold",
                        }}>
                  Learn more
                </Button>
            )}
          </Box>

          {/* Not connected: show connect prompt */}
          {!isConnected && (
              <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: { xs: 6, sm: 8, md: 10 },
                    gap: 3,
                  }}
              >
                <Box
                    component="img"
                    src={connectIcon}
                    alt="Connect"
                    sx={{
                      width: { xs: 64, sm: 80 },
                      height: { xs: 64, sm: 80 },
                      opacity: 0.5,
                      filter: theme.palette.mode === "dark" ? "invert(0)" : "invert(1)",
                    }}
                />
                <Typography
                    variant="h5"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ fontWeight: 500, maxWidth: 400 }}
                >
                  Connect to a Bob server to start exploring prediction markets
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<LinkIcon />}
                    onClick={() => setServerModalOpen(true)}
                    sx={{
                      borderRadius: 10,
                      px: 4,
                      py: 1.5,
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                >
                  Connect to Server
                </Button>
              </Box>
          )}

          {/* Connected: show filter, search, events */}
          {isConnected && (
              <>
                {/* Filter, Search and Refresh */}
                <Box sx={{ position: "relative", mb: { xs: 3, sm: 3 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <ModernSearchFilter
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          filterOptions={filterOptions}
                          currentFilterOption={selectedTagIndex}
                          onFilterChange={(idx) => setSelectedTagIndex(idx)}
                      />
                    </Box>
                    <Tooltip title="Refresh events">
                  <span>
                    <IconButton aria-label='refresh events' onClick={handleRefresh}
                                disabled={isLoadingOverall} size='small'>
                      <RefreshIcon fontSize='small' sx={{ color: theme.palette.text.secondary }} />
                    </IconButton>
                  </span>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Events Grid */}
                {isLoadingOverall ? renderLoading() : (
                    <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
                      {Array.isArray(eventsToDisplay) && eventsToDisplay.length > 0 ? (
                          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} justifyContent='center' alignItems='stretch'>
                            <AnimatePresence>
                              {eventsToDisplay.map((event, index) => {
                                const stableKey = event?.eid ?? `evt-${index}`;
                                return (
                                    <Grid item xs={12} sm={6} md={4} lg={4} key={stableKey}
                                          component={motion.div} variants={cardVariants}
                                          initial='initial' animate='animate' exit='exit'
                                          style={{ display: "flex" }}>
                                      <EventOverviewCard
                                          data={{ ...event, desc: event.desc }}
                                          onClick={() => handleEventClick(event.eid)}
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
                            <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 500 }}>
                              No events found.
                            </Typography>
                          </Box>
                      )}
                    </Box>
                )}
              </>
          )}
        </Container>

        <ServerConnectModal
            open={serverModalOpen}
            onClose={() => setServerModalOpen(false)}
        />
      </Box>
  );
}

export default StartPage;
