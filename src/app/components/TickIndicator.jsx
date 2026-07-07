import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { formatQubicAmount } from './qubic/util';
import { getNetworkTick, PUBLIC_TICK_TOLERANCE } from './qubic/util/bobApi';
import { useConfig } from '../contexts/ConfigContext';
import { useQuotteryContext } from '../contexts/QuotteryContext';

async function fetchBobStatus(bobUrl) {
    try {
        const res = await fetch(`${bobUrl}/status`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

function extractEpoch(status) {
    const epoch = Number(
        status?.currentProcessingEpoch
        ?? status?.status?.currentProcessingEpoch
        ?? status?.data?.currentProcessingEpoch
        ?? status?.result?.currentProcessingEpoch
        ?? 0
    );
    return Number.isFinite(epoch) && epoch > 0 ? epoch : null;
}

const TickIndicator = ({ topBar = false }) => {
    const theme = useTheme();
    const { bobUrl, isConnected, devMode } = useConfig();
    const { tickRate, adaptiveOffset } = useQuotteryContext();
    const [bobTick, setBobTick] = useState(null);
    const [publicTick, setPublicTick] = useState(null);
    const [epoch, setEpoch] = useState(null);
    const [tickSource, setTickSource] = useState('unknown');
    const [networkStatus, setNetworkStatus] = useState('unknown');

    const refresh = useCallback(async () => {
        if (!isConnected || !bobUrl) return;

        const [tickInfo, status] = await Promise.all([
            getNetworkTick(bobUrl),
            fetchBobStatus(bobUrl),
        ]);
        const bt = tickInfo.bobTick;
        const pt = tickInfo.publicTick;

        setBobTick(bt || null);
        setPublicTick(pt || null);
        setEpoch(extractEpoch(status));
        setTickSource(tickInfo.source);

        if (devMode) {
            setNetworkStatus(bt ? 'dev' : 'bad');
            return;
        }

        if (!bt) {
            setNetworkStatus('bad');
        } else if (pt === null) {
            setNetworkStatus('unknown');
        } else if (Math.abs(bt - pt) <= PUBLIC_TICK_TOLERANCE) {
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
        ? `Epoch: ${epoch || dash} | Bob tick: ${bobTick ? formatQubicAmount(bobTick) : dash} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset} (dev mode)`
        : `Epoch: ${epoch || dash} | Bob: ${bobTick ? formatQubicAmount(bobTick) : dash} | Public: ${publicTick ? formatQubicAmount(publicTick) : dash} | source: ${tickSource} | ${tickRate.toFixed(1)} t/s, offset +${adaptiveOffset}`;

    return (
        <Tooltip title={tooltipContent} arrow>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: topBar ? { xs: 0.8, sm: 1.1 } : 0.75,
                px: topBar ? 0 : { xs: 1, sm: 1.5 }, py: topBar ? 0 : 0.5, borderRadius: 1,
                maxWidth: topBar ? 'none' : { xs: 118, sm: 'none' },
                bgcolor: topBar ? 'transparent' : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                cursor: 'default', userSelect: 'none',
            }}>
                <Typography variant="caption" sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    color: theme.palette.text.secondary,
                    fontWeight: 700,
                    fontSize: topBar ? '0.72rem' : '0.65rem',
                    whiteSpace: 'nowrap',
                }}>
                    Epoch: <Box component="span" sx={{ color: theme.palette.text.primary, ml: 0.35 }}>{epoch || dash}</Box>
                </Typography>
                <Box sx={{
                    width: topBar ? 7 : 8, height: topBar ? 7 : 8, borderRadius: '50%',
                    bgcolor: dotColor,
                    boxShadow: `0 0 6px ${dotColor}`,
                }} />
                <Typography variant="caption" sx={{
                    fontFamily: 'monospace',
                    fontWeight: topBar ? 700 : 600,
                    color: topBar ? theme.palette.text.primary : theme.palette.text.secondary,
                    fontSize: topBar ? { xs: '0.68rem', sm: '0.74rem' } : { xs: '0.68rem', sm: '0.75rem' },
                    whiteSpace: 'nowrap',
                }}>
                    Tick: {tickSource === 'public' && publicTick ? formatQubicAmount(publicTick) : (bobTick ? formatQubicAmount(bobTick) : dash)}
                </Typography>
                <Typography variant="caption" sx={{ display: { xs: 'none', md: 'block' }, color: dotColor, fontWeight: 700, fontSize: topBar ? '0.68rem' : '0.65rem', whiteSpace: 'nowrap' }}>
                    {statusLabels[networkStatus]}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default TickIndicator;
