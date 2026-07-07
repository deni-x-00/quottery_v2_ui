const API_BASE = process.env.REACT_APP_QUOTTERY_API_BASE || "";

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function requestJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.error) {
    throw new Error(body?.details || body?.error || `Request failed with ${response.status}`);
  }

  return body;
}
