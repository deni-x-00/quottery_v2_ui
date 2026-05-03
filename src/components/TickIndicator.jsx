import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { formatQubicAmount } from './qubic/util';
import { getNetworkTick } from './qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';

const TICK_TOLERANCE = 50; // ticks difference considered "in sync"

const TickIndicator = () => {
    const theme = useTheme();
    const { bobUrl, isConnected, devMode } = useConfig();
    const { tickRate, adaptiveOffset } = useQuotteryContext();
    const [bobTick, setBobTick] = useState(null);
    const [publicTick, setPublicTick] = useState(null);
    const [tickSource, setTickSource] = useState('unknown');
    const [networkStatus, setNetworkStatus] = useState('unknown');

    const refresh = useCallback(async () => {
        if (!isConnected || !bobUrl) return;

        const tickInfo = await getNetworkTick(bobUrl);
        const bt = tickInfo.bobTick;
        const pt = tickInfo.publicTick;

        setBobTick(bt || null);
        setPublicTick(pt || null);
        setTickSource(tickInfo.source);

        if (devMode) {
            setNetworkStatus(bt ? 'dev' : 'bad');
            return;
        }

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
        bad: tickSource === 'public' ? 'Using public tick' : 'Bob Network: bad',
        unknown: 'Bob Network: unknown',
        dev: 'Dev Mode',
    };

    const dotColor = statusColors[networkStatus] || statusColors.unknown;
    const dash = '-';

    const tooltipContent = devMode
        ? `Bob tick: ${bobTick ? formatQubicAmount(bobTick) : dash} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset} (dev mode)`
        : `Bob: ${bobTick ? formatQubicAmount(bobTick) : dash} | Public: ${publicTick ? formatQubicAmount(publicTick) : dash} | source: ${tickSource} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset}`;

    return (
        <Tooltip title={tooltipContent} arrow>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: { xs: 1, sm: 1.5 }, py: 0.5, borderRadius: 1,
                maxWidth: { xs: 118, sm: 'none' },
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                cursor: 'default', userSelect: 'none',
            }}>
                <Box sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: dotColor,
                    boxShadow: `0 0 6px ${dotColor}`,
                }} />
                <Typography variant="caption" sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '0.68rem', sm: '0.75rem' },
                    whiteSpace: 'nowrap',
                }}>
                    {tickSource === 'public' && publicTick ? formatQubicAmount(publicTick) : (bobTick ? formatQubicAmount(bobTick) : dash)}
                </Typography>
                <Typography variant="caption" sx={{ display: { xs: 'none', md: 'block' }, color: dotColor, fontWeight: 600, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {statusLabels[networkStatus]}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default TickIndicator;
