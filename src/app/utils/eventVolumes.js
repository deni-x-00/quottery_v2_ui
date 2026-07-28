import { apiUrl } from "../api/client";

export { formatCompactAmount } from "./format";

export const getEventId = (event) => event?.eid ?? event?.eventId;

export const getEventVolumesUrl = (bobUrl, ids) => {
  const query = `ids=${encodeURIComponent(ids.join(","))}`;
  const fallbackPath = `/api/event-volumes?${query}`;

  if (!bobUrl || !/^https?:\/\//i.test(bobUrl)) {
    return fallbackPath;
  }

  try {
    const url = new URL(bobUrl);
    if (!/\/api\/bob\/?$/i.test(url.pathname)) {
      return fallbackPath;
    }
    url.pathname = url.pathname.replace(/\/api\/bob\/?$/i, "/api/event-volumes");
    url.search = query;
    return url.toString();
  } catch {
    return fallbackPath;
  }
};

export const getDbEventMetricsUrl = (ids) => {
  const query = `ids=${encodeURIComponent(ids.join(","))}`;
  return apiUrl(`/api/quottery/event-metrics?${query}`);
};

export async function fetchCachedEventVolumes(bobUrl, events, signal) {
  const eventIds = (Array.isArray(events) ? events : [])
      .map(getEventId)
      .filter((eventId) => eventId !== undefined && eventId !== null)
      .filter((eventId, index, array) => array.indexOf(eventId) === index);

  if (eventIds.length === 0) return {};

  return fetchEventVolumesByIds(bobUrl, eventIds, signal);
}

export async function fetchEventVolumesByIds(bobUrl, eventIds, signal) {
  const ids = (Array.isArray(eventIds) ? eventIds : [])
      .filter((eventId) => eventId !== undefined && eventId !== null)
      .filter((eventId, index, array) => array.indexOf(eventId) === index);

  if (ids.length === 0) {
    return {
      volumes: {},
      tradedVolumes: {},
      openOrderVolumes: {},
      probabilities: {},
      eventResults: {},
      eventStatuses: {},
      priceToBeat: {},
      finalPrice: {},
      deferredEventIds: [],
      missingEventIds: [],
      failedEventIds: [],
    };
  }

  try {
    const dbRes = await fetch(getDbEventMetricsUrl(ids), { signal });
    const dbBody = await dbRes.json().catch(() => ({}));
    if (dbRes.ok && !dbBody?.error) {
      const tradedVolumes = dbBody?.tradedVolumes || dbBody?.volumes || {};
      return {
        volumes: tradedVolumes,
        tradedVolumes,
        openOrderVolumes: dbBody?.openOrderVolumes || {},
        probabilities: dbBody?.probabilities || {},
        eventResults: dbBody?.eventResults || {},
        eventStatuses: dbBody?.eventStatuses || {},
        priceToBeat: dbBody?.priceToBeat || {},
        finalPrice: dbBody?.finalPrice || {},
        partial: false,
        deferredEventIds: [],
        missingEventIds: [],
        failedEventIds: [],
        source: dbBody?.source || "db",
        cached: Boolean(dbBody?.cached),
        lastUpdatedAt: dbBody?.lastUpdatedAt || 0,
      };
    }
  } catch (error) {
    if (error.name === "AbortError") throw error;
  }

  const res = await fetch(getEventVolumesUrl(bobUrl, ids), { signal });
  const body = await res.json();
  if (!res.ok || body?.error) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }

  return {
    volumes: body?.volumes || {},
    tradedVolumes: body?.tradedVolumes || body?.volumes || {},
    openOrderVolumes: body?.openOrderVolumes || body?.volumes || {},
    probabilities: body?.probabilities || {},
    eventResults: body?.eventResults || {},
    eventStatuses: body?.eventStatuses || {},
    priceToBeat: body?.priceToBeat || {},
    finalPrice: body?.finalPrice || {},
    partial: Boolean(body?.partial),
    deferredEventIds: Array.isArray(body?.deferredEventIds) ? body.deferredEventIds : [],
    missingEventIds: Array.isArray(body?.missingEventIds) ? body.missingEventIds : [],
    failedEventIds: Array.isArray(body?.failedEventIds) ? body.failedEventIds : [],
    source: body?.source,
    cached: body?.cached,
    lastUpdatedAt: body?.lastUpdatedAt || 0,
  };
}
