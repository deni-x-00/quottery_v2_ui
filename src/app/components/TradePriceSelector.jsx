import React from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { formatQubicAmount } from "./qubic/util";

const PRICE_PRESETS = [10, 25, 50, 75, 90];
const WHOLE_SHARE_PRICE = 100000;
const MAX_PRICE = WHOLE_SHARE_PRICE - 1;

const toPrice = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.min(MAX_PRICE, Math.max(0, parsed)) : 0;
};

export default function TradePriceSelector({
    value,
    onChange,
    disabled,
    label = "Price",
}) {
    const numericValue = toPrice(value);
    const probability = ((numericValue / WHOLE_SHARE_PRICE) * 100).toFixed(2);

    const setPrice = (nextPrice) => {
        const safePrice = Math.min(MAX_PRICE, Math.max(0, Number(nextPrice || 0)));
        onChange(String(safePrice));
    };

    const handleInputChange = (raw) => {
        if (raw === "") {
            onChange("");
            return;
        }
        const normalized = raw.replace(/^0+(?=\d)/, "");
        if (!/^\d+$/.test(normalized)) return;
        setPrice(normalized);
    };

    return (
        <Stack spacing={1.25}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Probability: {probability}%
                </Typography>
            </Box>
            <TextField
                label="Price (out of 100,000)"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                fullWidth
                size="small"
                placeholder={formatQubicAmount(50000)}
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
                {PRICE_PRESETS.map((pct) => (
                    <Button
                        key={pct}
                        size="small"
                        variant={numericValue === pct * 1000 ? "contained" : "outlined"}
                        onClick={() => setPrice(pct * 1000)}
                        disabled={disabled}
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
                        {pct}%
                    </Button>
                ))}
            </Box>
        </Stack>
    );
}
