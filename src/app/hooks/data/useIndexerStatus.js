import { useCallback, useEffect, useState } from "react";
import { getIndexerStatus, getPublicTick } from "../../api/quotteryApi";

function extractPublicLiveTick(status) {
  const tick = Number(
    status?.tick
    ?? status?.tickInfo?.tick
    ?? 0
  );
  return Number.isFinite(tick) && tick > 0 ? tick : null;
}

export default function useIndexerStatus({ intervalMs = 30000, enabled = true } = {}) {
  const [indexerStatus, setIndexerStatus] = useState(null);
  const [liveTick, setLiveTick] = useState(null);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setIndexerStatus(null);
      setLiveTick(null);
      return;
    }

    try {
      const [indexerBody, publicTickBody] = await Promise.all([
        getIndexerStatus(),
        getPublicTick(),
      ]);
      setIndexerStatus(indexerBody.status || null);
      setLiveTick(extractPublicLiveTick(publicTickBody));
    } catch {
      setIndexerStatus(null);
      setLiveTick(null);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
    if (!enabled || !intervalMs) return undefined;
    const intervalId = window.setInterval(refetch, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs, refetch]);

  return { indexerStatus, liveTick, refetch };
}
