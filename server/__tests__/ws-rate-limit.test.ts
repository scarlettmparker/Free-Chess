import { TokenBucket } from '~server/ws-rate-limit';

describe('TokenBucket', () => {
  test('allows the configured burst then refills over time', () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 }, 0);

    expect(bucket.take(0)).toBe(true);
    expect(bucket.take(0)).toBe(true);
    expect(bucket.take(0)).toBe(false);
    expect(bucket.take(500)).toBe(false);
    expect(bucket.take(1000)).toBe(true);
    expect(bucket.take(1000)).toBe(false);
  });

  test('does not refill past the capacity', () => {
    const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 10 }, 0);

    expect(bucket.take(5000)).toBe(true);
    expect(bucket.take(5000)).toBe(true);
    expect(bucket.take(5000)).toBe(false);
  });
});
