import { useCallback, useEffect, useState } from "react";
import { getLeaderboardEpochs } from "../../api/quotteryApi";

export default function useLeaderboardEpochs() {
  const [epochs, setEpochs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await getLeaderboardEpochs();
      const nextEpochs = Array.isArray(body.epochs) ? body.epochs : [];
      setEpochs(nextEpochs);
      return nextEpochs;
    } catch (err) {
      setEpochs([]);
      setError(err.message || "Failed to load epochs");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { epochs, loading, error, refetch };
}
