/**
 * Tiny in-memory TTL cache. Fronts every upstream (gov-API) call so we don't
 * hammer them and so responses stay fast. `now` is injectable for testing.
 */
interface Entry {
  value: unknown;
  expiresAt: number;
}

export class TTLCache {
  private store = new Map<string, Entry>();

  constructor(private now: () => number = () => Date.now()) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  /** Return the cached value, or run `fetcher`, cache it for `ttlMs`, and return it. */
  async wrap<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const value = await fetcher();
    this.set(key, value, ttlMs);
    return value;
  }
}
