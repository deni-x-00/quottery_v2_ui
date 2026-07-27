import React from "react";
import { Box, IconButton, Stack, Typography, useTheme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import HelpIcon from "@mui/icons-material/Help";
import { getTagGroupInfo, getTagInfo, getTagSlug } from "./qubic/util/tagMap";
import { isEventClosed } from "./qubic/util/tradeValidation";
import EventCountdown from "./EventCountdown";
import { useTranslation } from "react-i18next";
import { formatRational, formatRationalDelta } from "../utils/format";

function EventHeader({ event, onBack, resolveThumbnail }) {
    const { t } = useTranslation();
    const theme = useTheme();
    const tagInfo = getTagInfo(event?.tag);
    const groupInfo = getTagGroupInfo(event?.tag);
    const thumbSrc = tagInfo.thumbnail && resolveThumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
    const groupLabel = t(`markets.groups.${groupInfo.id}`, { defaultValue: groupInfo.label });
    const topicLabel = t(`markets.tags.${getTagSlug(event?.tag)}`, { defaultValue: tagInfo.label });
    const hasEnded = Boolean(event && isEventClosed(event));
    const priceToBeat = event?.priceToBeat;
    const finalPrice = event?.finalPrice;
    const formattedPriceToBeat = priceToBeat
        ? formatRational(priceToBeat.numerator, priceToBeat.denominator, 2)
        : null;
    const formattedFinalPrice = finalPrice
        ? formatRational(finalPrice.numerator, finalPrice.denominator, 2)
        : null;
    const priceDelta = priceToBeat && finalPrice
        ? formatRationalDelta(
            finalPrice.numerator,
            finalPrice.denominator,
            priceToBeat.numerator,
            priceToBeat.denominator,
            2,
        )
        : null;
    const deltaColor = priceDelta?.direction > 0
        ? theme.palette.success.main
        : priceDelta?.direction < 0
            ? theme.palette.error.main
            : theme.palette.text.secondary;
    const quoteCurrency = finalPrice?.quoteCurrency || priceToBeat?.quoteCurrency || "";

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
                    {formattedPriceToBeat && formattedPriceToBeat !== "-" && (
                        <Stack
                            direction="row"
                            alignItems="baseline"
                            spacing={1}
                            sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.25 }}
                        >
                            <Typography
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                }}
                            >
                                {t("eventDetails.priceToBeat")}
                            </Typography>
                            <Typography
                                sx={{
                                    color: "text.primary",
                                    fontSize: { xs: "1rem", sm: "1.16rem" },
                                    fontWeight: 850,
                                }}
                            >
                                {formattedPriceToBeat} {priceToBeat.quoteCurrency}
                            </Typography>
                            {formattedFinalPrice && formattedFinalPrice !== "-" && (
                                <Stack
                                    direction="row"
                                    alignItems="baseline"
                                    spacing={0.55}
                                    sx={{
                                        pl: { xs: 1.25, sm: 2 },
                                        ml: { xs: 0.25, sm: 1 },
                                        borderLeft: `1px solid ${theme.palette.border.soft}`,
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: "text.secondary",
                                            fontSize: "0.72rem",
                                            fontWeight: 800,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {t("eventDetails.finalPrice")}
                                    </Typography>
                                    {priceDelta && priceDelta.value !== "-" && (
                                        <Stack direction="row" alignItems="center" spacing={0} sx={{ color: deltaColor }}>
                                            {priceDelta.direction > 0 && <ArrowDropUpIcon sx={{ fontSize: 16, ml: -0.3 }} />}
                                            {priceDelta.direction < 0 && <ArrowDropDownIcon sx={{ fontSize: 16, ml: -0.3 }} />}
                                            <Typography sx={{ color: "inherit", fontSize: "0.72rem", fontWeight: 800 }}>
                                                {priceDelta.direction > 0 ? "+" : ""}{priceDelta.value}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Typography
                                        sx={{
                                            color: "text.primary",
                                            fontSize: { xs: "1rem", sm: "1.16rem" },
                                            fontWeight: 850,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formattedFinalPrice} {quoteCurrency}
                                    </Typography>
                                </Stack>
                            )}
                            {priceToBeat.timeframe && (
                                <Typography
                                    sx={{
                                        color: "text.secondary",
                                        fontSize: "0.74rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {priceToBeat.timeframe} · {t("eventDetails.oracleOpeningPrice")}
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Box>
            </Stack>

            <Box sx={{ gridColumn: { xs: "2 / 3", sm: "auto" }, justifySelf: { xs: "start", sm: "end" }, mt: { xs: 0.5, sm: 0 } }}>
                <EventCountdown endDate={event?.endDate} compact forceEnded={hasEnded} />
            </Box>
        </Box>
    );
}

export default EventHeader;
