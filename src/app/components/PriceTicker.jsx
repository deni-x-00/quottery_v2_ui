import React, { useEffect, useState } from "react";
import { Box, Skeleton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { getMarketPrices } from "./qubic/util/bobApi";
import { formatNumeric, formatUsd } from "../utils/format";
import qubicLogo from "../../assets/qubic.svg";
import garthLogo from "../../assets/garth.svg";

const PRICE_REFRESH_MS = 60_000;
const ONE_MILLION = 1_000_000;
const ONE_BILLION = 1_000_000_000;

function formatQubic(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "-";
    return formatNumeric(num);
}

function PriceGroup({ prices, showIcons = true, topBar = false }) {
    const theme = useTheme();
    const qubicUsd = formatUsd(prices.qubicUsd * ONE_BILLION);
    const garthQubic = formatQubic(prices.garthQubic);
    const garthUsd = formatUsd(prices.garthUsd * ONE_MILLION);
    const textSx = {
        color: topBar ? "text.secondary" : "primary.main",
        fontFamily: "var(--quottery-font-mono)",
        fontSize: topBar ? { xs: "0.67rem", sm: "0.74rem" } : { xs: "0.63rem", sm: "0.68rem" },
        fontWeight: topBar ? 700 : 800,
        lineHeight: 1,
    };

    return (
        <Tooltip title={`QUBIC: ${qubicUsd} per bQUBIC | GARTH: ${garthQubic} QUBIC, ${garthUsd} per 1M GARTH`} arrow>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: topBar ? { xs: 1, sm: 1.5 } : { xs: 0.65, sm: 0.8 },
                    px: topBar ? 0 : { xs: 0.75, sm: 0.9 },
                    py: topBar ? 0 : 0.42,
                    borderRadius: 1,
                    border: topBar ? "none" : `1px solid ${theme.palette.divider}`,
                    bgcolor: topBar
                        ? "transparent"
                        : theme.palette.mode === "dark" ? "rgba(0,212,200,0.06)" : "rgba(0,122,114,0.06)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.35 }}>
                    {showIcons && (
                        <Box
                            component="img"
                            src={qubicLogo}
                            alt="QUBIC"
                            sx={{ width: { xs: 13, sm: 15 }, height: { xs: 13, sm: 15 }, flexShrink: 0, display: "block" }}
                        />
                    )}
                    <Typography component="span" sx={textSx}>
                        {topBar ? `QUBIC: ${qubicUsd}/bQ` : `${qubicUsd}/bQ`}
                    </Typography>
                </Box>
                <Box sx={{ width: 1, height: 16, bgcolor: theme.palette.divider, opacity: 0.8 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.35 }}>
                    {showIcons && (
                        <Box
                            component="img"
                            src={garthLogo}
                            alt="GARTH"
                            sx={{ width: { xs: 13, sm: 15 }, height: { xs: 13, sm: 15 }, flexShrink: 0, display: "block" }}
                        />
                    )}
                    <Typography component="span" sx={textSx}>
                        {topBar ? `GARTH: ${garthQubic}Q | ${garthUsd}/1M` : `${garthQubic}Q | ${garthUsd}/1M`}
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default function PriceTicker({ showIcons = true, topBar = false }) {
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const nextPrices = await getMarketPrices();
                if (!cancelled) setPrices(nextPrices);
            } catch (error) {
                console.warn("[PriceTicker] Failed to load prices:", error.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        const intervalId = window.setInterval(load, PRICE_REFRESH_MS);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, []);

    if (loading && !prices) {
        return (
            <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                <Skeleton variant="rounded" width={topBar ? 260 : 178} height={topBar ? 16 : 25} />
            </Stack>
        );
    }

    if (!prices) return null;

    return (
        <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
            <PriceGroup prices={prices} showIcons={showIcons} topBar={topBar} />
        </Stack>
    );
}
