import { useCallback, useEffect, useState } from "react";
import { excludedEventIds } from "../../components/qubic/util/commons";
import { fetchEventDetail } from "../../components/qubic/util/eventApi";
import { fetchEventVolumesByIds } from "../../utils/eventVolumes";

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

      const [updatedEvent, metrics] = await Promise.all([
        fetchEventDetail(bobUrl, eventId),
        fetchEventVolumesByIds(bobUrl, [eventId]).catch(() => null),
      ]);
      const priceToBeat = metrics?.priceToBeat?.[eventId] || null;
      const finalPrice = metrics?.finalPrice?.[eventId] || null;
      const mergedEvent = updatedEvent
        ? { ...updatedEvent, priceToBeat, finalPrice }
        : null;
      setEvent(mergedEvent);
      return mergedEvent;
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
