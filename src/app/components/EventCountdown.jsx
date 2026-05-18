import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { parseQubicUtcDate } from "./qubic/util/tradeValidation";

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;

function getCountdownParts(endTime, nowTime) {
    const remainingMs = Math.max(0, endTime - nowTime);
    let rest = remainingMs;

    const months = Math.floor(rest / MONTH_MS);
    rest -= months * MONTH_MS;
    const days = Math.floor(rest / DAY_MS);
    rest -= days * DAY_MS;
    const hours = Math.floor(rest / HOUR_MS);
    rest -= hours * HOUR_MS;
    const minutes = Math.floor(rest / MINUTE_MS);
    rest -= minutes * MINUTE_MS;
    const seconds = Math.floor(rest / SECOND_MS);

    return { months, days, hours, minutes, seconds, isEnded: remainingMs <= 0 };
}

function CountdownUnit({ value, label, compact = false, color }) {
    return (
        <Box sx={{ minWidth: compact ? { xs: 36, sm: 46 } : { xs: 44, sm: 56 }, textAlign: "center" }}>
            <Typography
                sx={{
                    color,
                    fontSize: compact ? { xs: "1.05rem", sm: "1.45rem" } : { xs: "1.45rem", sm: "1.9rem" },
                    fontWeight: 800,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {String(value).padStart(2, "0")}
            </Typography>
            <Typography
                sx={{
                    color: "text.secondary",
                    fontSize: compact ? { xs: "0.54rem", sm: "0.64rem" } : { xs: "0.62rem", sm: "0.72rem" },
                    fontWeight: 700,
                    letterSpacing: 0,
                    mt: 0.5,
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

function EventCountdown({ endDate, compact = false, forceEnded = false }) {
    const theme = useTheme();
    const [nowTime, setNowTime] = useState(() => Date.now());
    const endTime = useMemo(() => {
        const parsedDate = parseQubicUtcDate(endDate);
        const time = parsedDate?.getTime();
        return Number.isFinite(time) ? time : null;
    }, [endDate]);

    useEffect(() => {
        if (!endTime) return undefined;

        const intervalId = setInterval(() => {
            setNowTime(Date.now());
        }, SECOND_MS);

        return () => clearInterval(intervalId);
    }, [endTime]);

    if (!endTime) return null;

    const parts = getCountdownParts(endTime, nowTime);
    const isEnded = forceEnded || parts.isEnded;
    const countdownColor = isEnded ? theme.palette.error.main : theme.palette.primary.main;
    const units = [
        ...(parts.months > 0 ? [{ value: parts.months, label: "MONTHS" }] : []),
        ...(parts.months > 0 || parts.days > 0 ? [{ value: parts.days, label: "DAYS" }] : []),
        { value: parts.hours, label: "HRS" },
        { value: parts.minutes, label: "MINS" },
        { value: parts.seconds, label: "SECS" },
    ];

    return (
        <Box
            sx={{
                mt: compact ? 0 : 1.5,
                mb: compact ? 0 : 1.5,
                px: compact ? 0 : { xs: 1.5, sm: 2 },
                py: compact ? 0 : { xs: 1.5, sm: 1.75 },
                borderRadius: compact ? 0 : 1.5,
                border: compact ? 0 : `1px solid ${alpha(countdownColor, 0.3)}`,
                bgcolor: compact
                    ? "transparent"
                    : alpha(countdownColor, theme.palette.mode === "dark" ? 0.08 : 0.06),
            }}
        >
            {!compact && (
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        textAlign: "center",
                        color: "text.secondary",
                        fontWeight: 700,
                        mb: 1,
                    }}
                >
                    {isEnded ? "EVENT ENDED" : "TIME LEFT"}
                </Typography>
            )}
            <Stack direction="row" spacing={compact ? { xs: 1, sm: 1.35 } : { xs: 1.5, sm: 2.25 }} justifyContent="center" useFlexGap flexWrap="wrap">
                {isEnded ? (
                    <Typography
                        sx={{
                            color: countdownColor,
                            fontSize: compact ? { xs: "1.05rem", sm: "1.45rem" } : { xs: "1.45rem", sm: "1.9rem" },
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        ENDED
                    </Typography>
                ) : units.map((unit) => (
                    <CountdownUnit key={unit.label} value={unit.value} label={unit.label} compact={compact} color={countdownColor} />
                ))}
            </Stack>
        </Box>
    );
}

export default EventCountdown;
