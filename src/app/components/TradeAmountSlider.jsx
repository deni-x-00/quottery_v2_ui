import React from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { formatQubicAmount } from "./qubic/util";
import { useTranslation } from "react-i18next";

const AMOUNT_PRESETS = [10, 25, 50, 75, 100];

const toPositiveInt = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export default function TradeAmountSlider({
    label,
    value,
    max,
    unit,
    availableValue,
    availableUnit,
    onChange,
    disabled,
}) {
    const { t } = useTranslation();
    const visibleLabel = label || t("eventDetails.shares");
    const visibleUnit = unit || t("eventDetails.shareUnit");
    const resolvedAvailable = availableValue ?? max;
    const numericValue = toPositiveInt(value);
    const numericMax = Number(max || 0);
    const controlsDisabled = disabled || numericMax <= 0;

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

    const presetValue = (percent) => (
        percent === 100
            ? numericMax
            : Math.max(1, Math.floor((numericMax * percent) / 100))
    );

    return (
        <Stack spacing={1.25}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    {visibleLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {resolvedAvailable === null || resolvedAvailable === undefined
                        ? t("eventDetails.availableUnavailable")
                        : t("eventDetails.available", {
                            value: formatQubicAmount(resolvedAvailable),
                            unit: availableUnit ?? visibleUnit,
                        })}
                </Typography>
            </Box>
            <TextField
                label={visibleLabel}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                fullWidth
                size="small"
                placeholder={numericMax > 0
                    ? t("eventDetails.maxShares", { value: formatQubicAmount(numericMax) })
                    : t("eventDetails.unavailable")}
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                disabled={disabled}
            />
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 44px))",
                    justifyContent: "center",
                    gap: 0.75,
                }}
            >
                {AMOUNT_PRESETS.map((percent) => (
                    <Button
                        key={percent}
                        size="small"
                        variant={numericValue === presetValue(percent) ? "contained" : "outlined"}
                        onClick={() => setPreset(percent)}
                        disabled={controlsDisabled}
                        sx={{
                            minWidth: 0,
                            width: 44,
                            height: 28,
                            px: 0,
                            borderRadius: 1,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: "none",
                        }}
                    >
                        {percent}%
                    </Button>
                ))}
            </Box>
        </Stack>
    );
}
