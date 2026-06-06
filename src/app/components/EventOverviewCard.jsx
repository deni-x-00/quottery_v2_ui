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
    Button,
    Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import HelpIcon from "@mui/icons-material/Help";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BarChartIcon from "@mui/icons-material/BarChart";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { getCanonicalTagId, getTagInfo } from "./qubic/util/tagMap";
import { isEventClosed } from "./qubic/util/tradeValidation";
import { formatCompactAmount } from "../utils/eventVolumes";
import QuickBuyModal from "./QuickBuyModal";

const thumbnails = require.context("../../assets", true, /\.(png|jpe?g|svg|gif|webp)$/);
const yesColor = "#2e7d32";
const yesColorDark = "#81c784";
const noColor = "#d32f2f";
const noColorDark = "#ef9a9a";

function EventOverviewCard({ data, eventUrl = "", onClick, status = "", onTxBroadcast }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const [isHovered, setIsHovered] = useState(false);
    const [quickBuyOpen, setQuickBuyOpen] = useState(false);
    const [quickBuyOption, setQuickBuyOption] = useState(0);

    const dynamicColors = {
        shadowNormal: isDarkMode ? "0 4px 8px rgba(0,0,0,0.6)" : "0 4px 8px rgba(0,0,0,0.1)",
        shadowHover: isDarkMode ? "0 12px 30px rgba(0,0,0,0.9)" : "0 14px 34px rgba(25,118,210,0.22)",
        cardBorderHover: isDarkMode ? "rgba(97,240,254,0.65)" : "rgba(25,118,210,0.55)",
        cardBackgroundHover: isDarkMode ? "rgba(97,240,254,0.08)" : "rgba(25,118,210,0.08)",
    };

    const resolveThumbnail = (name) => {
        try { return thumbnails(`./${name}`); }
        catch { return null; }
    };

    const tagInfo = getTagInfo(data?.tag);
    const tagId = getCanonicalTagId(data?.tag);
    const thumbSrc = tagInfo.thumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;
    const hasEnded = isEventClosed(data);
    const hasTradedVolume = data?.tradedVolume !== undefined && data?.tradedVolume !== null;
    const hasOpenOrderVolume = data?.openOrderVolume !== undefined && data?.openOrderVolume !== null;
    const chancePercent = Number(data?.probability?.percent);
    const normalizedChancePercent = Number.isFinite(chancePercent)
        ? Math.max(0, Math.min(100, chancePercent))
        : null;
    const formatChance = (value) => value.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    const option0Chance = normalizedChancePercent === null ? null : `${formatChance(normalizedChancePercent)}%`;
    const option1Chance = normalizedChancePercent === null ? null : `${formatChance(100 - normalizedChancePercent)}%`;

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
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
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
                    borderRadius: 2,
                    border: `1px solid ${isHovered ? dynamicColors.cardBorderHover : theme.palette.divider}`,
                    backgroundColor: isHovered ? dynamicColors.cardBackgroundHover : theme.palette.background.paper,
                    boxShadow: isHovered ? dynamicColors.shadowHover : dynamicColors.shadowNormal,
                    transition: "background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.3s ease, transform 0.2s ease",
                    overflow: "hidden",
                    "&:hover": { transform: "translateY(-3px)" },
                }}
            >
                {/* Tag badge */}
                {tagId !== 0 && (
                    <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 1 }}>
                        <Chip
                            label={tagInfo.label}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
                                color: theme.palette.text.secondary,
                            }}
                        />
                    </Box>
                )}
                <CardContent sx={{ p: 3, position: "relative" }}>
                    {/* Thumbnail + Title */}
                    <Stack direction="row" alignItems="center" spacing={2} mb={0}>
                        <Box sx={{
                            width: { xs: 32, sm: 38 }, height: { xs: 32, sm: 38 },
                            backgroundColor: theme.palette.action.hover, borderRadius: 1,
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
                            fontWeight: 600, flex: 1, color: theme.palette.text.primary, fontFamily: "Inter, sans-serif",
                            fontSize: { xs: "clamp(0.8rem, 0.6vw, 1rem)", sm: "clamp(0.8rem, 0.6vw, 1.8rem)" },
                            display: isHovered ? "block" : "-webkit-box",
                            WebkitLineClamp: isHovered ? "unset" : 2, WebkitBoxOrient: "vertical",
                            overflow: "hidden", lineHeight: 1.1, pr: { xs: "60px", sm: "50px" },
                        }}>
                            {data.desc}
                        </Typography>
                    </Stack>

                    {/* Option buttons — open quick buy modal */}
                    {data.option0Desc && data.option1Desc && (
                        <Stack direction="row" spacing={1.5} sx={{ mt: 2, mb: 1 }}>
                            <Button
                                variant="contained" disableElevation fullWidth
                                onClick={(e) => handleOptionClick(e, 0)}
                                sx={{
                                    flex: 1, py: 0.75, borderRadius: 1.5, textTransform: "none", fontWeight: 700,
                                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                                    bgcolor: isDarkMode ? "rgba(129,199,132,0.18)" : "rgba(46,125,50,0.1)",
                                    color: isDarkMode ? yesColorDark : "#1b5e20",
                                    border: `1px solid ${isDarkMode ? "rgba(129,199,132,0.34)" : "rgba(46,125,50,0.24)"}`,
                                    transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, transform 0.18s ease",
                                    "&:hover": {
                                        bgcolor: yesColor,
                                        borderColor: yesColor,
                                        color: "#fff",
                                        boxShadow: isDarkMode ? "0 6px 16px rgba(46,125,50,0.32)" : "0 6px 16px rgba(46,125,50,0.22)",
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                {data.option0Desc}
                                {option0Chance && (
                                    <Box component="span" sx={{ ml: 1, fontSize: "0.88em", fontWeight: 800, lineHeight: "inherit", opacity: 0.9 }}>
                                        {option0Chance}
                                    </Box>
                                )}
                            </Button>
                            <Button
                                variant="contained" disableElevation fullWidth
                                onClick={(e) => handleOptionClick(e, 1)}
                                sx={{
                                    flex: 1, py: 0.75, borderRadius: 1.5, textTransform: "none", fontWeight: 700,
                                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                                    bgcolor: isDarkMode ? "rgba(239,154,154,0.16)" : "rgba(211,47,47,0.1)",
                                    color: isDarkMode ? noColorDark : "#7f1d1d",
                                    border: `1px solid ${isDarkMode ? "rgba(239,154,154,0.28)" : "rgba(211,47,47,0.22)"}`,
                                    transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, transform 0.18s ease",
                                    "&:hover": {
                                        bgcolor: noColor,
                                        borderColor: noColor,
                                        color: "#fff",
                                        boxShadow: isDarkMode ? "0 6px 16px rgba(211,47,47,0.3)" : "0 6px 16px rgba(211,47,47,0.22)",
                                        transform: "translateY(-1px)",
                                    },
                                }}
                            >
                                {data.option1Desc}
                                {option1Chance && (
                                    <Box component="span" sx={{ ml: 1, fontSize: "0.88em", fontWeight: 800, lineHeight: "inherit", opacity: 0.9 }}>
                                        {option1Chance}
                                    </Box>
                                )}
                            </Button>
                        </Stack>
                    )}

                    <Divider sx={{ mb: 2, mt: 1, opacity: 0.6, borderColor: theme.palette.divider }} />

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
                            <AccessTimeIcon sx={{ fontSize: "1.2rem", [theme.breakpoints.down("sm")]: { fontSize: "1rem" } }} />
                            <Typography
                                variant="body2"
                                noWrap={!isHovered}
                                sx={{
                                    fontSize: "0.9rem",
                                    overflow: isHovered ? "visible" : "hidden",
                                    textOverflow: isHovered ? "clip" : "ellipsis",
                                    minWidth: 0,
                                    [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" },
                                }}
                            >
                                {hasEnded ? "Ended" : data.endDate}
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
                                        <Tooltip title="Traded volume" arrow>
                                            <Box display="flex" alignItems="center" gap={0.35}>
                                                <BarChartIcon sx={{ fontSize: "0.95rem", [theme.breakpoints.down("sm")]: { fontSize: "0.86rem" } }} />
                                                <Typography
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
                                        <Tooltip title="Open orders volume" arrow>
                                            <Box display="flex" alignItems="center" gap={0.35}>
                                                <FormatListBulletedIcon sx={{ fontSize: "0.95rem", [theme.breakpoints.down("sm")]: { fontSize: "0.86rem" } }} />
                                                <Typography
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
