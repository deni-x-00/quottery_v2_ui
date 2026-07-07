import { requestJson } from "./client";

export function getPortfolio(identity, { limit = 1000, signal } = {}) {
  return requestJson(`/api/quottery/accounts/${identity}?limit=${encodeURIComponent(limit)}`, { signal });
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

export function searchIdentities(query, { limit = 8, signal } = {}) {
  return requestJson(`/api/quottery/search?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`, { signal });
}

export function getArchivedEvents({ limit = 1000, signal } = {}) {
  return requestJson(`/api/quottery/events?status=archived&limit=${encodeURIComponent(limit)}`, { signal });
}
