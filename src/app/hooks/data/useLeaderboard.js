import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getEpochRanks, getLeaderboard, getPeriodRanks } from "../../api/quotteryApi";

export default function useLeaderboard(
  metric,
  {
    limit = 1000,
    enabled = true,
    startTime = null,
    endTime = null,
    epoch = null,
  } = {},
) {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!enabled) {
      setLeaders([]);
      setError("");
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const hasPeriod = Boolean(epoch || (startTime && endTime));
      const body = epoch
        ? await getEpochRanks(epoch, metric === "volume" ? "vol" : "pnl", { limit })
        : startTime && endTime
          ? await getPeriodRanks(
          startTime,
          endTime,
          metric === "volume" ? "vol" : "pnl",
          { limit },
        )
        : await getLeaderboard(metric, { limit });
      const nextLeaders = hasPeriod
        ? (body.ranks || []).map((row) => ({
          rank: row.rank,
          identity: row.walletid,
          realized_pnl: row.pnl,
          traded_volume: row.vol,
          display_name: row.display_name || null,
          avatar_updated_at: row.avatar_updated_at || null,
          has_avatar: Boolean(row.has_avatar),
        }))
        : body.leaders || [];
      if (requestId !== requestIdRef.current) return nextLeaders;
      setLeaders(nextLeaders);
      return nextLeaders;
    } catch (err) {
      if (requestId !== requestIdRef.current) return [];
      setLeaders([]);
      setError(err.message || t("leaderboard.failedLoad"));
      return [];
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [enabled, endTime, epoch, limit, metric, startTime, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { leaders, loading, error, refetch };
}
