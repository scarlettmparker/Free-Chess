/**
 * @fileoverview In-memory fixed-window rate limiter.
 * @module server/rate-limit
 */

/**
 * One window of requests for a key.
 */
type Bucket = {
  /**
   * Requests seen in the window.
   */
  count: number;
  /**
   * Window end in milliseconds.
   */
  resetAt: number;
};

/**
 * Options for a rate-limited key.
 */
export type RateLimitOptions = {
  /**
   * Window length in milliseconds.
   */
  windowMs: number;
  /**
   * Requests allowed per window.
   */
  max: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Drops expired buckets once the map grows.
 *
 * @param now Current time in milliseconds.
 */
function sweep(now: number) {
  if (buckets.size < 1_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Records one attempt and reports whether it is allowed.
 *
 * @param key Caller-scoped key.
 * @param options Window and limit.
 * @returns True when the attempt fits in the window.
 */
export function rateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return true;
  }

  if (bucket.count >= options.max) return false;

  bucket.count += 1;
  return true;
}

/**
 * Clears every window.
 */
export function resetRateLimits() {
  buckets.clear();
}
