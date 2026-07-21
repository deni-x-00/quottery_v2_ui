import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLeaderboard } from "../../api/quotteryApi";

export default function useLeaderboard(metric, { limit = 1000, enabled = true } = {}) {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLeaders([]);
      setError("");
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const body = await getLeaderboard(metric, { limit });
      const nextLeaders = body.leaders || [];
      setLeaders(nextLeaders);
      return nextLeaders;
    } catch (err) {
      setLeaders([]);
      setError(err.message || t("leaderboard.failedLoad"));
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, metric, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { leaders, loading, error, refetch };
}
