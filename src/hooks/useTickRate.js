import { useState, useEffect, useCallback, useRef } from 'react';
import { getNetworkTick } from '../components/qubic/util/bobApi';

const POLL_INTERVAL_MS = 3000;   // sample every 3 seconds
const MAX_SAMPLES = 20;          // keep ~60s window
const DEFAULT_RATE = 2;          // conservative default: 2 ticks/sec
const TARGET_LEAD_SECONDS = 5;   // schedule tx ~5 real seconds ahead
const MIN_OFFSET = 10;           // never less than 10 ticks


export function useTickRate(bobUrl) {
    const [tickRate, setTickRate] = useState(DEFAULT_RATE);
    const [latestTick, setLatestTick] = useState(0);
    const [tickSource, setTickSource] = useState('unknown');
    const [bobLag, setBobLag] = useState(0);
    const samplesRef = useRef([]);

    // Background polling
    useEffect(() => {
        if (!bobUrl) return;

        let active = true;

        const poll = async () => {
            try {
                const tickInfo = await getNetworkTick(bobUrl);
                const tick = tickInfo.tick;
                if (!active || !tick) return;

                const now = Date.now();
                const samples = samplesRef.current;
                samples.push({ tick, time: now });

                // Trim to sliding window
                while (samples.length > MAX_SAMPLES) samples.shift();

                setLatestTick(tick);
                setTickSource(tickInfo.source);
                setBobLag(tickInfo.isBobLagging ? tickInfo.lag : 0);

                // Need at least 3 samples over >=2s for a reasonable rate
                if (samples.length >= 3) {
                    const oldest = samples[0];
                    const newest = samples[samples.length - 1];
                    const dtMs = newest.time - oldest.time;
                    const dTick = newest.tick - oldest.tick;

                    if (dtMs >= 2000 && dTick > 0) {
                        const rate = dTick / (dtMs / 1000);
                        setTickRate(rate);
                    }
                }
            } catch {
                // Ignore transient Bob/status failures.
            }
        };

        // Immediate first poll
        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [bobUrl]);

    // Compute adaptive offset for a given lead time
    const computeOffset = useCallback(
        (leadSeconds = TARGET_LEAD_SECONDS) => {
            return Math.max(MIN_OFFSET, Math.ceil(tickRate * leadSeconds));
        },
        [tickRate]
    );

    const getScheduledTick = useCallback(
        async (leadSeconds = TARGET_LEAD_SECONDS) => {
            const freshTick = await getNetworkTick(bobUrl);
            const tick = freshTick.tick || latestTick;
            if (!tick) return null;

            const offset = Math.max(MIN_OFFSET, Math.ceil(tickRate * leadSeconds));
            return {
                currentTick: tick,
                scheduledTick: tick + offset,
                tickRate,
                offset,
                source: freshTick.source,
                bobTick: freshTick.bobTick,
                publicTick: freshTick.publicTick,
                bobLag: freshTick.isBobLagging ? freshTick.lag : 0,
                isBobLagging: freshTick.isBobLagging,
            };
        },
        [bobUrl, latestTick, tickRate]
    );

    return {
        tickRate,
        latestTick,
        tickSource,
        bobLag,
        adaptiveOffset: computeOffset(),
        getScheduledTick,
    };
}
