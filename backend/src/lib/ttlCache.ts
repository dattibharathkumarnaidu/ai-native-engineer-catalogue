/**
 * Caches the result of a single async loader for `ttlMs`.
 * Concurrent callers share one in-flight request; failures are not cached.
 */
export function cachedLoader<T>(
  loader: () => Promise<T>,
  ttlMs: number,
  now: () => number = Date.now,
): () => Promise<T> {
  let value: { data: T; expiresAt: number } | undefined;
  let inFlight: Promise<T> | undefined;

  return async () => {
    if (value && value.expiresAt > now()) return value.data;
    if (inFlight) return inFlight;

    inFlight = loader()
      .then((data) => {
        value = { data, expiresAt: now() + ttlMs };
        return data;
      })
      .finally(() => {
        inFlight = undefined;
      });
    return inFlight;
  };
}
