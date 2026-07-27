import React, { memo, useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Stack,
    useTheme,
    Divider,
    Chip,
    Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import HelpIcon from "@mui/icons-material/Help";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { getCanonicalTagId, getTagInfo, getTagSlug } from "./qubic/util/tagMap";
import { isEventClosed } from "./qubic/util/tradeValidation";
import { formatCompactAmount } from "../utils/eventVolumes";
import { formatPercent, formatRational } from "../utils/format";
import QuickBuyModal from "./QuickBuyModal";
import { OutcomeButton, StatusBadge } from "./ui";
import { useTranslation } from "react-i18next";

const thumbnails = require.context("../../assets", true, /\.(png|jpe?g|svg|gif|webp)$/);

function EventOverviewCard({ data, eventUrl = "", onClick, status = "", onTxBroadcast }) {
    const theme = useTheme();
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const [quickBuyOpen, setQuickBuyOpen] = useState(false);
    const [quickBuyOption, setQuickBuyOption] = useState(0);

    const resolveThumbnail = (name) => {
        try { return thumbnails(`./${name}`); }
        catch { return null; }
    };

    const tagInfo = getTagInfo(data?.tag);
    const tagId = getCanonicalTagId(data?.tag);
    const thumbSrc = tagInfo.thumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
    const hasEnded = isEventClosed(data);
    const cardStatus = status || (hasEnded ? "closed" : "open");
    const resultOption = Number(data?.resultByGO);
    const hasPublishedResult =
        data?.resultByGO !== null &&
        data?.resultByGO !== undefined &&
        (resultOption === 0 || resultOption === 1);
    const resultLabel = resultOption === 0
        ? (data?.option0Desc || t("marketCard.resultYes"))
        : (data?.option1Desc || t("marketCard.resultNo"));
    const hasTradedVolume = data?.tradedVolume !== undefined && data?.tradedVolume !== null;
    const hasOpenOrderVolume = data?.openOrderVolume !== undefined && data?.openOrderVolume !== null;
    const chancePercent = Number(data?.probability?.percent);
    const normalizedChancePercent = Number.isFinite(chancePercent)
        ? Math.max(0, Math.min(100, chancePercent))
        : null;
    const option0Chance = normalizedChancePercent === null ? null : formatPercent(normalizedChancePercent);
    const option1Chance = normalizedChancePercent === null ? null : formatPercent(100 - normalizedChancePercent);
    const priceToBeat = data?.priceToBeat;
    const formattedPriceToBeat = priceToBeat
        ? formatRational(priceToBeat.numerator, priceToBeat.denominator)
        : null;

    const handleOptionClick = (e, optionIndex) => {
        e.preventDefault();
        e.stopPropagation();
        setQuickBuyOption(optionIndex);
        setQuickBuyOpen(true);
    };

    const handleCardClick = (event) => {
        if (event.defaultPrevented) return;
        if (eventUrl && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1)) {
            return;
        }
        if (eventUrl) event.preventDefault();
        onClick?.(event);
    };

    return (
        <>
            <Card
                component={eventUrl ? motion.a : motion.div}
                href={eventUrl || undefined}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={handleCardClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                elevation={2}
                sx={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    color: "inherit",
                    textDecoration: "none",
                    position: "relative",
                    borderRadius: 1.5,
                    border: `1px solid ${isHovered ? theme.palette.border.default : theme.palette.border.soft}`,
                    backgroundColor: isHovered ? theme.palette.surface[2] : theme.palette.surface[1],
                    boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.34)" : theme.shadows[1],
                    transition: "background-color 150ms ease, border-color 150ms ease, box-shadow 250ms ease, transform 250ms ease",
                    overflow: "hidden",
                    "&:hover": { transform: "translateY(-2px)" },
                }}
            >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: "relative" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                        {tagId !== 0 ? (
                            <Chip
                                label={t(`markets.tags.${getTagSlug(tagId)}`, { defaultValue: tagInfo.label })}
                                size="small"
                                sx={{
                                    height: 26,
                                    fontWeight: 800,
                                    fontSize: "0.7rem",
                                    bgcolor: theme.palette.surface[2],
                                    color: theme.palette.text.secondary,
                                    border: `1px solid ${theme.palette.border.soft}`,
                                }}
                            />
                        ) : (
                            <Box />
                        )}
                        {hasPublishedResult ? (
                            <Stack direction="row" alignItems="center" spacing={0.55} sx={{ minWidth: 0 }}>
                                <StatusBadge
                                    status={resultOption === 0 ? "resolved" : "lose"}
                                    label={resultLabel}
                                    size="xs"
                                />
                                <Typography component="span" variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 750 }}>
                                    -
                                </Typography>
                                <StatusBadge status="closed" size="xs" />
                            </Stack>
                        ) : (
                            <StatusBadge status={cardStatus} size="xs" />
                        )}
                    </Stack>

                    {/* Thumbnail + Title */}
                    <Stack direction="row" alignItems="center" spacing={2} mb={0}>
                        <Box sx={{
                            width: { xs: 40, sm: 46 }, height: { xs: 40, sm: 46 },
                            backgroundColor: theme.palette.surface[2],
                            border: `1px solid ${theme.palette.border.soft}`,
                            borderRadius: 1.25,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, overflow: "hidden",
                        }}>
                            {thumbSrc ? (
                                <img src={thumbSrc} alt={data?.desc || "event"}
                                     style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                                <HelpIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" }, color: theme.palette.text.secondary }} />
                            )}
                        </Box>
                        <Typography variant="h6" sx={{
                            fontWeight: 800, flex: 1, color: theme.palette.text.primary,
                            fontSize: { xs: "0.94rem", sm: "1rem" },
                            display: isHovered ? "block" : "-webkit-box",
                            WebkitLineClamp: isHovered ? "unset" : 2, WebkitBoxOrient: "vertical",
                            overflow: "hidden", lineHeight: 1.22,
                        }}>
                            {data.desc}
                        </Typography>
                    </Stack>

                    {/* Option buttons — open quick buy modal */}
                    {formattedPriceToBeat && formattedPriceToBeat !== "-" && (
                        <Stack
                            direction="row"
                            alignItems="baseline"
                            justifyContent="space-between"
                            spacing={1}
                            sx={{ mt: 1.5, minWidth: 0 }}
                        >
                            <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary, fontWeight: 750 }}
                            >
                                {t("eventDetails.priceToBeat")}
                            </Typography>
                            <Typography
                                variant="body2"
                                noWrap
                                sx={{ color: theme.palette.text.primary, fontWeight: 850, minWidth: 0 }}
                            >
                                {formattedPriceToBeat} {priceToBeat.quoteCurrency || ""}
                            </Typography>
                        </Stack>
                    )}

                    {data.option0Desc && data.option1Desc && (
                        <Stack direction="row" spacing={1.5} sx={{ mt: 2, mb: 1 }}>
                            <OutcomeButton
                                outcome="yes"
                                label={data.option0Desc}
                                value={option0Chance}
                                onClick={(e) => handleOptionClick(e, 0)}
                            />
                            <OutcomeButton
                                outcome="no"
                                label={data.option1Desc}
                                value={option1Chance}
                                onClick={(e) => handleOptionClick(e, 1)}
                            />
                        </Stack>
                    )}

                    <Divider sx={{ mb: 1.75, mt: 1.5, borderColor: theme.palette.border.soft }} />

                    {/* End date */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}
                           sx={{ color: theme.palette.text.secondary, minWidth: 0 }}>
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            sx={{
                                minWidth: 0,
                                flex: "1 1 auto",
                            }}
                        >
                            <AccessTimeIcon sx={{ fontSize: "1.1rem", color: theme.palette.text.secondary, [theme.breakpoints.down("sm")]: { fontSize: "1rem" } }} />
                            <Typography
                                variant="body2"
                                noWrap={!isHovered}
                                sx={{
                                    fontSize: "0.82rem",
                                    fontWeight: 650,
                                    overflow: isHovered ? "visible" : "hidden",
                                    textOverflow: isHovered ? "clip" : "ellipsis",
                                    minWidth: 0,
                                    [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
                                }}
                            >
                                {hasEnded ? t("marketCard.ended") : data.endDate}
                            </Typography>
                        </Box>
                        {(hasTradedVolume || hasOpenOrderVolume) && (
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={0.8}
                                sx={{
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <Stack direction="row" spacing={0.85} alignItems="center">
                                    {hasTradedVolume && (
                                        <Tooltip title={t("marketCard.tradedVolume")} arrow>
                                            <Box display="flex" alignItems="center" gap={0.35}>
                                                <BarChartIcon sx={{ fontSize: "0.95rem", [theme.breakpoints.down("sm")]: { fontSize: "0.86rem" } }} />
                                                <Typography
                                                    className="volume"
                                                    variant="body2"
                                                    sx={{
                                                        fontSize: "0.78rem",
                                                        fontWeight: 650,
                                                        lineHeight: 1,
                                                        [theme.breakpoints.down("sm")]: { fontSize: "0.72rem" },
                                                    }}
                                                >
                                                    {formatCompactAmount(data.tradedVolume)}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    )}
                                    {hasOpenOrderVolume && (
                                        <Tooltip title={t("marketCard.openOrdersVolume")} arrow>
                                            <Box display="flex" alignItems="center" gap={0.35}>
                                                <FormatListBulletedIcon sx={{ fontSize: "0.95rem", [theme.breakpoints.down("sm")]: { fontSize: "0.86rem" } }} />
                                                <Typography
                                                    className="volume"
                                                    variant="body2"
                                                    sx={{
                                                        fontSize: "0.78rem",
                                                        fontWeight: 650,
                                                        lineHeight: 1,
                                                        [theme.breakpoints.down("sm")]: { fontSize: "0.72rem" },
                                                    }}
                                                >
                                                    {formatCompactAmount(data.openOrderVolume)}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    )}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </Card>

            {/* Quick Buy Modal */}
            <QuickBuyModal
                open={quickBuyOpen}
                onClose={() => setQuickBuyOpen(false)}
                event={data}
                initialOption={quickBuyOption}
                onTxBroadcast={onTxBroadcast}
            />
        </>
    );
}

export default memo(EventOverviewCard);
