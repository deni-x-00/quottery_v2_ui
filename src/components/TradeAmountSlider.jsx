import React from "react";
import {
    Box,
    Chip,
    Slider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { formatQubicAmount } from "./qubic/util";

const AMOUNT_PRESETS = [25, 50, 75, 100];

const toPositiveInt = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const availableLabel = (value, unit) => (
    value === null || value === undefined
        ? "Available: unavailable"
        : `Available: ${formatQubicAmount(value)} ${unit}`
);

export default function TradeAmountSlider({
    label = "Shares",
    value,
    max,
    unit = "shares",
    availableValue,
    availableUnit,
    onChange,
    disabled,
}) {
    const numericValue = toPositiveInt(value);
    const numericMax = Number(max || 0);
    const sliderMax = Math.max(1, numericMax);
    const cappedValue = Math.min(numericValue, sliderMax);
    const controlsDisabled = disabled || numericMax <= 0;
    const presetMarks = AMOUNT_PRESETS.map((percent) => Math.floor((sliderMax * percent) / 100));

    const handleInputChange = (raw) => {
        if (raw === "") {
            onChange("");
            return;
        }
        const normalized = raw.replace(/^0+(?=\d)/, "");
        if (!/^\d+$/.test(normalized)) return;
        onChange(normalized);
    };

    const setPreset = (percent) => {
        if (controlsDisabled) return;
        const nextValue = percent === 100
            ? numericMax
            : Math.max(1, Math.floor((numericMax * percent) / 100));
        onChange(String(nextValue));
    };

    return (
        <Stack spacing={1.25}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {availableLabel(availableValue ?? max, availableUnit ?? unit)}
                </Typography>
            </Box>
            <Slider
                value={cappedValue}
                min={0}
                max={sliderMax}
                step={1}
                disabled={controlsDisabled}
                onChange={(_, nextValue) => onChange(String(nextValue))}
                valueLabelDisplay="auto"
                valueLabelFormat={(nextValue) => formatQubicAmount(nextValue)}
                marks={presetMarks.map((mark) => ({ value: mark }))}
                sx={{
                    mx: 1,
                    mb: 0.25,
                }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {AMOUNT_PRESETS.map((percent) => (
                    <Chip
                        key={percent}
                        label={percent === 100 ? "Max" : `${percent}%`}
                        size="small"
                        variant={percent === 100 ? "filled" : "outlined"}
                        color={percent === 100 ? "primary" : "default"}
                        onClick={() => setPreset(percent)}
                        disabled={controlsDisabled}
                        sx={{ minWidth: 56 }}
                    />
                ))}
            </Stack>
            <TextField
                label={label}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                fullWidth
                size="small"
                placeholder={numericMax > 0 ? `Max ${formatQubicAmount(numericMax)} shares` : "Unavailable"}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                disabled={disabled}
            />
        </Stack>
    );
}
