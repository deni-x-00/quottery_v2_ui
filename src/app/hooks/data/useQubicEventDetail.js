import { useCallback, useEffect, useState } from "react";
import { excludedEventIds } from "../../components/qubic/util/commons";
import { fetchEventDetail } from "../../components/qubic/util/eventApi";

export default function useQubicEventDetail(id, bobUrl, {
  onInvalidId,
} = {}) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const eventId = parseInt(id, 10);
      if (!id || !Number.isFinite(eventId) || excludedEventIds.includes(eventId)) {
        setEvent(null);
        if (onInvalidId) onInvalidId();
        return null;
      }

      const updatedEvent = await fetchEventDetail(bobUrl, eventId);
      setEvent(updatedEvent || null);
      return updatedEvent || null;
    } catch (error) {
      console.error("Error updating event details:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bobUrl, id, onInvalidId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { event, loading, refetch, setEvent };
}
