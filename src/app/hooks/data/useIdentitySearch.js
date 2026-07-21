import { useEffect, useState } from "react";
import { searchIdentities } from "../../api/quotteryApi";
import { normalizeIdentity } from "../../utils/format";

export default function useIdentitySearch(search, {
  limit = 8,
  delayMs = 180,
  identityRegex,
} = {}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = String(search || "").trim();
    const normalizedIdentity = normalizeIdentity(query);
    if (!query) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const body = await searchIdentities(query, { limit });
        const remoteOptions = body.results || [];
        const byIdentity = new Map();

        if (identityRegex?.test(normalizedIdentity)) {
          byIdentity.set(normalizedIdentity, { identity: normalizedIdentity, source: "typed" });
        }
        for (const option of remoteOptions) {
          if (option?.identity) byIdentity.set(option.identity, option);
        }

        if (!cancelled) setOptions(Array.from(byIdentity.values()));
      } catch {
        if (!cancelled) {
          setOptions(identityRegex?.test(normalizedIdentity) ? [{ identity: normalizedIdentity, source: "typed" }] : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delayMs, identityRegex, limit, search]);

  return { options, loading, setOptions };
}
