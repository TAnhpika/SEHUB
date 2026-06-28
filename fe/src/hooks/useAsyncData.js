import { useEffect, useState } from "react";

/**
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {unknown[]} deps
 * @param {{ initialData?: T, enabled?: boolean }} [options]
 */
export function useAsyncData(fetcher, deps, options = {}) {
  const { initialData = null, enabled = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetcher identity intentionally excluded
  }, [enabled, ...deps]);

  return { data, setData, loading, error };
}
