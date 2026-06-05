import { useCallback, useEffect, useState } from "react";
import { fetchDashboardData } from "./dashboardApi";

/**
 * @param {"month" | "quarter" | "year"} [initialPeriod]
 */
export function useDashboardData(initialPeriod = "month") {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (nextPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchDashboardData(nextPeriod);
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  function changePeriod(next) {
    if (next !== period) {
      setPeriod(next);
    }
  }

  function refresh() {
    load(period);
  }

  return {
    period,
    setPeriod: changePeriod,
    data,
    loading,
    error,
    refresh,
  };
}
