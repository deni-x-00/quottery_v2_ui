import React from "react";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpIcon from "@mui/icons-material/Help";
import { getTagGroupInfo, getTagInfo } from "./qubic/util/tagMap";
import EventCountdown from "./EventCountdown";

function EventHeader({ event, onBack, resolveThumbnail }) {
    const theme = useTheme();
    const tagInfo = getTagInfo(event?.tag);
    const groupInfo = getTagGroupInfo(event?.tag);
    const thumbSrc = tagInfo.thumbnail && resolveThumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
    const topicLabel = tagInfo.label === "General" ? "General" : tagInfo.label;

    return (
        <Box
            component="header"
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "auto minmax(0, 1fr)", sm: "auto minmax(0, 1fr) auto" },
                alignItems: "center",
                gap: { xs: 1.25, sm: 2 },
                mb: 3,
            }}
        >
            <IconButton aria-label="go back" onClick={onBack} sx={{ alignSelf: "center" }}>
                <ArrowBackIcon />
            </IconButton>

            <Stack direction="row" spacing={{ xs: 1.25, sm: 2 }} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                    sx={{
                        width: { xs: 48, sm: 60 },
                        height: { xs: 48, sm: 60 },
                        backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                    }}
                >
                    {thumbSrc ? (
                        <img
                            src={thumbSrc}
                            alt={event?.desc || "event"}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                    ) : (
                        <HelpIcon sx={{ fontSize: { xs: "1.7rem", sm: "2.1rem" }, color: theme.palette.text.secondary }} />
                    )}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{
                            color: "text.secondary",
                            fontSize: { xs: "0.82rem", sm: "0.95rem" },
                            fontWeight: 700,
                            mb: 0.45,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {groupInfo.label} <Box component="span" sx={{ opacity: 0.55 }}>·</Box> {topicLabel}
                    </Typography>
                    <Typography
                        component="h1"
                        color="text.primary"
                        sx={{
                            fontSize: { xs: "1.08rem", sm: "1.45rem" },
                            fontWeight: 800,
                            lineHeight: 1.15,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {event?.desc}
                    </Typography>
                </Box>
            </Stack>

            <Box sx={{ gridColumn: { xs: "2 / 3", sm: "auto" }, justifySelf: { xs: "start", sm: "end" }, mt: { xs: 0.5, sm: 0 } }}>
                <EventCountdown endDate={event?.endDate} compact />
            </Box>
        </Box>
    );
}

export default EventHeader;
