import React from "react";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpIcon from "@mui/icons-material/Help";
import { getTagGroupInfo, getTagInfo, getTagSlug } from "./qubic/util/tagMap";
import { isEventClosed } from "./qubic/util/tradeValidation";
import EventCountdown from "./EventCountdown";
import { useTranslation } from "react-i18next";

function EventHeader({ event, onBack, resolveThumbnail }) {
    const { t } = useTranslation();
    const theme = useTheme();
    const tagInfo = getTagInfo(event?.tag);
    const groupInfo = getTagGroupInfo(event?.tag);
    const thumbSrc = tagInfo.thumbnail && resolveThumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
    const groupLabel = t(`markets.groups.${groupInfo.id}`, { defaultValue: groupInfo.label });
    const topicLabel = t(`markets.tags.${getTagSlug(event?.tag)}`, { defaultValue: tagInfo.label });
    const hasEnded = Boolean(event && isEventClosed(event));

    return (
        <Box
            component="header"
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "auto minmax(0, 1fr)", sm: "auto minmax(0, 1fr) auto" },
                alignItems: "center",
                gap: { xs: 1.25, sm: 2 },
                mb: 3,
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.border.soft}`,
                bgcolor: theme.palette.surface[1],
            }}
        >
            <IconButton
                aria-label={t("eventDetails.goBack")}
                onClick={onBack}
                sx={{
                    alignSelf: "center",
                    width: 40,
                    height: 40,
                    border: `1px solid ${theme.palette.border.soft}`,
                    bgcolor: theme.palette.surface[2],
                    color: "text.secondary",
                    "&:hover": {
                        color: "text.primary",
                        borderColor: theme.palette.border.default,
                        bgcolor: theme.palette.surface[3],
                    },
                }}
            >
                <ArrowBackIcon />
            </IconButton>

            <Stack direction="row" spacing={{ xs: 1.25, sm: 2 }} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                    sx={{
                        width: { xs: 48, sm: 60 },
                        height: { xs: 48, sm: 60 },
                        backgroundColor: theme.palette.surface[2],
                        border: `1px solid ${theme.palette.border.soft}`,
                        borderRadius: 1.25,
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
                            alt={event?.desc || t("eventDetails.event")}
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
                            fontSize: { xs: "0.72rem", sm: "0.78rem" },
                            fontWeight: 900,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            mb: 0.45,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {groupLabel} <Box component="span" sx={{ opacity: 0.55 }}>·</Box> {topicLabel}
                    </Typography>
                    <Typography
                        component="h1"
                        color="text.primary"
                        sx={{
                            fontSize: { xs: "1.1rem", sm: "1.55rem", md: "1.85rem" },
                            fontWeight: 800,
                            lineHeight: 1.08,
                            letterSpacing: "-0.02em",
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
                <EventCountdown endDate={event?.endDate} compact forceEnded={hasEnded} />
            </Box>
        </Box>
    );
}

export default EventHeader;
