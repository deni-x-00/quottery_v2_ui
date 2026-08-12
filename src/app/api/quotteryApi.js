import { requestJson } from "./client";

export function getPortfolio(identity, { limit = 1000, signal } = {}) {
  return requestJson(`/api/quottery/accounts/${identity}?limit=${encodeURIComponent(limit)}`, { signal });
}

export function getNotifications(identity, { limit = 40, signal } = {}) {
  return requestJson(`/api/quottery/accounts/${encodeURIComponent(identity)}/notifications?limit=${encodeURIComponent(limit)}`, { signal });
}

export function getIndexerStatus({ signal } = {}) {
  return requestJson("/api/quottery/indexer-status", { signal });
}

export function getPublicTick({ signal } = {}) {
  return requestJson("/api/public-tick", { signal });
}

export function getLeaderboard(metric, { limit = 1000, signal } = {}) {
  return requestJson(`/api/quottery/leaderboard?metric=${encodeURIComponent(metric)}&limit=${encodeURIComponent(limit)}`, { signal });
}

export function getPeriodRanks(startTime, endTime, sortBy, { limit = 1000, signal } = {}) {
  const params = new URLSearchParams({
    starttime: startTime,
    endtime: endTime,
    sortby: sortBy,
    limit: String(limit),
  });
  return requestJson(`/api/quottery/ranks?${params.toString()}`, { signal });
}

export function getEpochRanks(epoch, sortBy, { limit = 1000, signal } = {}) {
  const params = new URLSearchParams({
    epoch: String(epoch),
    sortby: sortBy,
    limit: String(limit),
  });
  return requestJson(`/api/quottery/ranks?${params.toString()}`, { signal });
}

export function getLeaderboardEpochs({ signal } = {}) {
  return requestJson('/api/quottery/leaderboard/epochs', { signal });
}

export function searchIdentities(query, { limit = 8, signal } = {}) {
  return requestJson(`/api/quottery/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`, { signal });
}

export function getArchivedEvents({ limit = 1000, signal } = {}) {
  return requestJson(`/api/quottery/events?status=archived&limit=${encodeURIComponent(limit)}`, { signal });
}

export function profileAvatarUrl(identity, updatedAt = null) {
  if (!identity) return "";
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : "";
  return `/api/quottery/profiles/${encodeURIComponent(identity)}/avatar${version}`;
}

export function checkProfileNameAvailability(displayName, identity, { signal } = {}) {
  const params = new URLSearchParams({ name: displayName });
  if (identity) params.set("identity", identity);
  return requestJson(`/api/quottery/profiles/name-availability?${params.toString()}`, { signal });
}

export function saveProfile(identity, payload, { signal } = {}) {
  return requestJson(`/api/quottery/profiles/${encodeURIComponent(identity)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
}
