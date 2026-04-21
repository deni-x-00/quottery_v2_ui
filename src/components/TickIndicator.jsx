import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { formatQubicAmount } from './qubic/util';
import { getLatestTick } from './qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';

const PUBLIC_TICK_URLS = [
    { url: 'https://api.qubic.global/currenttick', parse: (d) => d?.tick || d?.currentTick || d },
    { url: 'https://api.qubic.li/public/currenttick', parse: (d) => d?.tick || d?.currentTick || d },
    { url: 'https://rpc.qubic.org/live/v1/tick-info', parse: (d) => d?.tickInfo?.tick || d?.tick || d },
];

const TICK_TOLERANCE = 50; // ticks difference considered "in sync"

async function fetchPublicTick() {
    for (const { url, parse } of PUBLIC_TICK_URLS) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            const data = await res.json();
            const tick = Number(parse(data));
            if (tick > 0) return tick;
        } catch {
            // try next
        }
    }
    return null;
}

const TickIndicator = () => {
    const theme = useTheme();
    const { bobUrl, isConnected, devMode } = useConfig();
    const { tickRate, adaptiveOffset } = useQuotteryContext();
    const [bobTick, setBobTick] = useState(null);
    const [publicTick, setPublicTick] = useState(null);
    const [networkStatus, setNetworkStatus] = useState('unknown');

    const refresh = useCallback(async () => {
        if (!isConnected || !bobUrl) return;

        // Fetch Bob tick
        const bt = await getLatestTick(bobUrl);
        setBobTick(bt || null);

        if (devMode) {
            setNetworkStatus(bt ? 'dev' : 'bad');
            return;
        }

        // Fetch public tick
        const pt = await fetchPublicTick();
        setPublicTick(pt);

        if (!bt) {
            setNetworkStatus('bad');
        } else if (pt === null) {
            setNetworkStatus('unknown');
        } else if (Math.abs(bt - pt) <= TICK_TOLERANCE) {
            setNetworkStatus('good');
        } else {
            setNetworkStatus('bad');
        }
    }, [bobUrl, isConnected, devMode]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 10000);
        return () => clearInterval(interval);
    }, [refresh]);

    if (!isConnected) return null;

    const statusColors = {
        good: theme.palette.success.main,
        bad: theme.palette.error.main,
        unknown: theme.palette.warning.main,
        dev: theme.palette.info.main,
    };

    const statusLabels = {
        good: 'Bob Network: good',
        bad: 'Bob Network: bad',
        unknown: 'Bob Network: unknown',
        dev: 'Dev Mode',
    };

    const dotColor = statusColors[networkStatus] || statusColors.unknown;

    const tooltipContent = devMode
        ? `Bob tick: ${bobTick ? formatQubicAmount(bobTick) : '—'} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset} (dev mode)`
        : `Bob: ${bobTick ? formatQubicAmount(bobTick) : '—'} | Public: ${publicTick ? formatQubicAmount(publicTick) : '—'} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset}`;

    return (
        <Tooltip title={tooltipContent} arrow>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1.5, py: 0.5, borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                cursor: 'default', userSelect: 'none',
            }}>
                <Box sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: dotColor,
                    boxShadow: `0 0 6px ${dotColor}`,
                }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: theme.palette.text.secondary }}>
                    {bobTick ? formatQubicAmount(bobTick) : '—'}
                </Typography>
                <Typography variant="caption" sx={{ color: dotColor, fontWeight: 600, fontSize: '0.65rem' }}>
                    {statusLabels[networkStatus]}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default TickIndicator;
