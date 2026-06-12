import React, { useEffect, useState } from "react";
import { Box, Skeleton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { getMarketPrices } from "./qubic/util/bobApi";
import qubicLogo from "../../assets/qubic.svg";
import garthLogo from "../../assets/garth.svg";

const PRICE_REFRESH_MS = 60_000;
const ONE_MILLION = 1_000_000;
const ONE_BILLION = 1_000_000_000;

function formatUsd(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "-";
    return `$${num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

function formatQubic(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "-";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function PriceGroup({ prices }) {
    const theme = useTheme();
    const qubicUsd = formatUsd(prices.qubicUsd * ONE_BILLION);
    const garthQubic = formatQubic(prices.garthQubic);
    const garthUsd = formatUsd(prices.garthUsd * ONE_MILLION);

    return (
        <Tooltip title={`QUBIC: ${qubicUsd} per bQUBIC | GARTH: ${garthQubic} QUBIC, ${garthUsd} per 1M GARTH`} arrow>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 0.65, sm: 0.8 },
                    px: { xs: 0.75, sm: 0.9 },
                    py: 0.42,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.mode === "dark" ? "rgba(0,212,200,0.06)" : "rgba(0,122,114,0.06)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.35 }}>
                    <Box
                        component="img"
                        src={qubicLogo}
                        alt="QUBIC"
                        sx={{ width: { xs: 13, sm: 15 }, height: { xs: 13, sm: 15 }, flexShrink: 0, display: "block" }}
                    />
                    <Typography
                        component="span"
                        sx={{
                            color: "primary.main",
                            fontFamily: "var(--quottery-font-mono)",
                            fontSize: { xs: "0.63rem", sm: "0.68rem" },
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        {qubicUsd}/bQ
                    </Typography>
                </Box>
                <Box sx={{ width: 1, height: 16, bgcolor: theme.palette.divider, opacity: 0.8 }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.35 }}>
                    <Box
                        component="img"
                        src={garthLogo}
                        alt="GARTH"
                        sx={{ width: { xs: 13, sm: 15 }, height: { xs: 13, sm: 15 }, flexShrink: 0, display: "block" }}
                    />
                    <Typography
                        component="span"
                        sx={{
                            color: "primary.main",
                            fontFamily: "var(--quottery-font-mono)",
                            fontSize: { xs: "0.63rem", sm: "0.68rem" },
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        {garthQubic}Q | {garthUsd}/1M
                    </Typography>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default function PriceTicker() {
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
                <Skeleton variant="rounded" width={178} height={25} />
            </Stack>
        );
    }

    if (!prices) return null;

    return (
        <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
            <PriceGroup prices={prices} />
        </Stack>
    );
}
