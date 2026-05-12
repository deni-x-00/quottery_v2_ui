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

export const formatCompactAmount = (value) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "0";

  const units = [
    { suffix: "B", value: 1_000_000_000 },
    { suffix: "M", value: 1_000_000 },
    { suffix: "K", value: 1_000 },
  ];
  const unit = units.find((item) => amount >= item.value);
  if (!unit) return String(Math.round(amount));

  const compact = amount / unit.value;
  const formatted = compact >= 10
      ? Math.round(compact).toString()
      : compact.toFixed(1).replace(/\.0$/, "");
  return `${formatted}${unit.suffix}`;
};

export async function fetchCachedEventVolumes(bobUrl, events, signal) {
  const eventIds = (Array.isArray(events) ? events : [])
      .map(getEventId)
      .filter((eventId) => eventId !== undefined && eventId !== null)
      .filter((eventId, index, array) => array.indexOf(eventId) === index);

  if (eventIds.length === 0) return {};

  const res = await fetch(getEventVolumesUrl(bobUrl, eventIds), { signal });
  const body = await res.json();
  if (!res.ok || body?.error) {
    throw new Error(body?.error || `HTTP ${res.status}`);
  }

  return body?.volumes || {};
}
