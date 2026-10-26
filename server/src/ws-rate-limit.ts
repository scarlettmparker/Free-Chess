/**
 * Token bucket settings for one socket.
 */
export type RateLimitOptions = {
  /**
   * Maximum stored tokens.
   */
  capacity: number;
  /**
   * Tokens restored per second.
   */
  refillPerSecond: number;
};

/**
 * Default limit for client messages.
 */
export const DEFAULT_MESSAGE_RATE_LIMIT: RateLimitOptions = {
  capacity: 20,
  refillPerSecond: 5,
};

/**
 * Token bucket used to limit messages from one socket.
 */
export class TokenBucket {
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private tokens: number;
  private updatedAt: number;

  /**
   * Create a full bucket.
   *
   * @param options Bucket settings.
   * @param now Current time in milliseconds.
   */
  constructor(options: RateLimitOptions, now = Date.now()) {
    this.capacity = options.capacity;
    this.refillPerSecond = options.refillPerSecond;
    this.tokens = options.capacity;
    this.updatedAt = now;
  }

  /**
   * Take one token when available.
   *
   * @param now Current time in milliseconds.
   * @returns True when the message is allowed.
   */
  take(now = Date.now()): boolean {
    const elapsed = Math.max(0, now - this.updatedAt) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
    this.updatedAt = now;

    if (this.tokens < 1) return false;

    this.tokens -= 1;
    return true;
  }
}
