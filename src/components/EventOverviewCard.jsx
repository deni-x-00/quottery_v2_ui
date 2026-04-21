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
} from "@mui/material";
import { motion } from "framer-motion";
import HelpIcon from "@mui/icons-material/Help";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getTagInfo } from "./qubic/util/tagMap";
import QuickBuyModal from "./QuickBuyModal";

const thumbnails = require.context("../assets", false, /\.(png|jpe?g|svg|gif|webp)$/);

function EventOverviewCard({ data, onClick, status = "", onTxBroadcast }) {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";
    const [isHovered, setIsHovered] = useState(false);
    const [quickBuyOpen, setQuickBuyOpen] = useState(false);
    const [quickBuyOption, setQuickBuyOption] = useState(0);

    const dynamicColors = {
        shadowNormal: isDarkMode ? "0 4px 8px rgba(0,0,0,0.6)" : "0 4px 8px rgba(0,0,0,0.1)",
        shadowHover: isDarkMode ? "0 8px 24px rgba(0,0,0,0.8)" : "0 8px 24px rgba(0,0,0,0.2)",
    };

    const resolveThumbnail = (name) => {
        try { return thumbnails(`./${name}`); }
        catch { return null; }
    };

    const tagInfo = getTagInfo(data?.tag);
    const thumbSrc = tagInfo.thumbnail ? resolveThumbnail(tagInfo.thumbnail) : null;

    const handleOptionClick = (e, optionIndex) => {
        e.stopPropagation();
        setQuickBuyOption(optionIndex);
        setQuickBuyOpen(true);
    };

    return (
        <>
            <Card
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                elevation={2}
                sx={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: isHovered ? dynamicColors.shadowHover : dynamicColors.shadowNormal,
                    transition: "box-shadow 0.3s ease, transform 0.2s ease",
                    overflow: "hidden",
                    "&:hover": { transform: "translateY(-2px)" },
                }}
            >
                {/* Tag badge */}
                {tagInfo.label !== "General" && (
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
                                    bgcolor: isDarkMode ? "rgba(33,150,243,0.2)" : "rgba(33,150,243,0.1)",
                                    color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
                                    "&:hover": { bgcolor: isDarkMode ? "rgba(33,150,243,0.35)" : "rgba(33,150,243,0.2)" },
                                }}
                            >
                                {data.option0Desc}
                            </Button>
                            <Button
                                variant="contained" disableElevation fullWidth
                                onClick={(e) => handleOptionClick(e, 1)}
                                sx={{
                                    flex: 1, py: 0.75, borderRadius: 1.5, textTransform: "none", fontWeight: 700,
                                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                                    bgcolor: isDarkMode ? "rgba(244,67,54,0.2)" : "rgba(244,67,54,0.1)",
                                    color: isDarkMode ? theme.palette.error.light : theme.palette.error.dark,
                                    "&:hover": { bgcolor: isDarkMode ? "rgba(244,67,54,0.35)" : "rgba(244,67,54,0.2)" },
                                }}
                            >
                                {data.option1Desc}
                            </Button>
                        </Stack>
                    )}

                    <Divider sx={{ mb: 2, mt: 1, opacity: 0.6, borderColor: theme.palette.divider }} />

                    {/* End date */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}
                           sx={{ color: theme.palette.text.secondary }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <AccessTimeIcon sx={{ fontSize: "1.2rem", [theme.breakpoints.down("sm")]: { fontSize: "1rem" } }} />
                            <Typography variant="body2" sx={{ fontSize: "0.9rem", [theme.breakpoints.down("sm")]: { fontSize: "0.8rem" } }}>
                                {data.endDate}
                            </Typography>
                        </Box>
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
