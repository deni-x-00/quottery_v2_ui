import { useCallback, useEffect } from "react";

function getValidEventId(event) {
  const eventId = event?.eid;
  return eventId !== undefined && eventId !== null && Number(eventId) >= 0
    ? eventId
    : null;
}

export default function useEventOrderbook(event, fetchOrderbook, {
  intervalMs = 60000,
} = {}) {
  const eventId = getValidEventId(event);

  const refreshData = useCallback(() => {
    if (eventId === null) return;
    fetchOrderbook(eventId, () => false);
  }, [eventId, fetchOrderbook]);

  useEffect(() => {
    if (eventId === null) return undefined;
    let cancelled = false;
    const isCancelled = () => cancelled;
    fetchOrderbook(eventId, isCancelled);
    return () => {
      cancelled = true;
    };
  }, [eventId, fetchOrderbook]);

  useEffect(() => {
    if (eventId === null || !intervalMs) return undefined;
    const intervalId = window.setInterval(refreshData, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [eventId, intervalMs, refreshData]);

  return { refreshData };
}
