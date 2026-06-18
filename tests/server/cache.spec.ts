import { describe, test, expect, vi } from 'vitest';
import { TTLCache } from '../../server/lib/cache';

describe('TTLCache', () => {
  test('returns a stored value before it expires', () => {
    let now = 1000;
    const cache = new TTLCache(() => now);

    cache.set('k', { v: 1 }, 5000);
    now = 4000;

    expect(cache.get<{ v: number }>('k')).toEqual({ v: 1 });
  });

  test('expires a value once its TTL has elapsed', () => {
    let now = 1000;
    const cache = new TTLCache(() => now);

    cache.set('k', 'hello', 5000);
    now = 6000; // 5s TTL elapsed

    expect(cache.get('k')).toBeUndefined();
  });

  test('returns undefined for an unknown key', () => {
    const cache = new TTLCache(() => 0);
    expect(cache.get('missing')).toBeUndefined();
  });

  test('wrap caches the fetcher result and only re-fetches after expiry', async () => {
    let now = 0;
    const cache = new TTLCache(() => now);
    const fetcher = vi.fn(async () => 'fresh');

    const a = await cache.wrap('k', 1000, fetcher);
    now = 500;
    const b = await cache.wrap('k', 1000, fetcher); // still cached
    now = 1500;
    const c = await cache.wrap('k', 1000, fetcher); // expired -> refetch

    expect([a, b, c]).toEqual(['fresh', 'fresh', 'fresh']);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
