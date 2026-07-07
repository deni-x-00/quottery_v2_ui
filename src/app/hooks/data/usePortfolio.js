import { useCallback, useEffect, useState } from "react";
import { getPortfolio } from "../../api/quotteryApi";

export default function usePortfolio(identity, { enabled = true, limit = 1000, validateIdentity } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!enabled || !identity || (validateIdentity && !validateIdentity(identity))) {
      setData(null);
      setError("");
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError("");
    try {
      const body = await getPortfolio(identity, { limit });
      setData(body);
      return body;
    } catch (err) {
      setData(null);
      setError(err.message || "Failed to load portfolio");
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, identity, limit, validateIdentity]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch, setData };
}
