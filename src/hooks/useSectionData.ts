import { useCallback, useEffect, useRef, useState } from "react";
import { describeApiError } from "@/services/http";

const GENERIC_FAILURE = "This section could not be loaded.";

export interface SectionState<T> {
  data: T | null;
  /** User-safe message; never a raw error or stack trace. */
  error: string | null;
  /** True only while there is nothing to show yet. */
  isLoading: boolean;
  /** True during a revalidation that keeps existing data on screen. */
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Loads one dashboard section independently.
 *
 * Each section owns its own request, so a failing endpoint degrades only that
 * card. `cacheKey` (typically `${eventId}:${token}`) restarts the load when
 * the event or session changes; stale responses are ignored via `active`.
 */
export function useSectionData<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  fallbackMessage: string = GENERIC_FAILURE,
  enabled: boolean = true,
): SectionState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  // Keep the latest fetcher without re-running the effect every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setIsRefreshing(false);
      setError(null);
      setData(null);
      return;
    }
    let active = true;

    if (data === null) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsRefreshing(true);
    }

    fetcherRef
      .current()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        // Existing data stays visible; only an empty section surfaces the error.
        setError(describeApiError(cause, fallbackMessage));
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      active = false;
    };
    // `data` is deliberately excluded: it only controls skeleton vs refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, nonce, fallbackMessage, enabled]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, isLoading, isRefreshing, refetch };
}
