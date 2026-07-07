import { useCallback, useEffect, useState } from "react";
import { getArchivedEvents } from "../../api/quotteryApi";

export default function useArchivedEvents({ limit = 1000, enabled = true } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!enabled) {
      setEvents([]);
      setError("");
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const body = await getArchivedEvents({ limit });
      const nextEvents = Array.isArray(body.events) ? body.events : [];
      setEvents(nextEvents);
      return nextEvents;
    } catch (err) {
      setError(err.message || "Failed to load archived markets");
      setEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { events, loading, error, refetch };
}
