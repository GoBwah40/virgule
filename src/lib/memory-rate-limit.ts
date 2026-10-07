// In-process rate limiter, used when Upstash is not configured. Pure (no server import), so it
// is tested on its own with fake timers.
//
// Per process only: each server process (each serverless instance on Vercel) keeps its own
// counters, and a cold start forgets them. It bounds a single process, not the whole fleet:
// Upstash stays the recommended production setup.

/**
 * Sliding window, approximated like Upstash's `slidingWindow`: a counter for the current fixed
 * window, plus the previous window's counter weighted by how much of it the sliding window
 * still overlaps. Two numbers per key, whatever the limit.
 */
type Entry = { window: number; current: number; previous: number };

export class MemoryRateLimiter {
  private readonly entries = new Map<string, Entry>();
  private lastSweep = 0;

  constructor(
    private readonly requests: number,
    private readonly windowMs: number,
    /** Past this many keys, the oldest ones are dropped: memory stays bounded under a flood. */
    private readonly maxKeys = 10_000,
  ) {}

  /** Counts a request for `key`. False if it goes over the limit (a refused request costs nothing). */
  limit(key: string, now = Date.now()): boolean {
    this.sweep(now);
    const window = Math.floor(now / this.windowMs);
    const entry = this.current(key, window);
    const elapsed = (now % this.windowMs) / this.windowMs;
    const used = entry.previous * (1 - elapsed) + entry.current;
    if (used + 1 > this.requests) return false;
    entry.current += 1;
    // Re-inserted last: the map stays ordered from least to most recently used.
    this.entries.delete(key);
    this.entries.set(key, entry);
    if (this.entries.size > this.maxKeys) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    return true;
  }

  /** Number of keys held, for the tests. */
  get size(): number {
    return this.entries.size;
  }

  /** The entry of `key`, rolled forward to `window`. */
  private current(key: string, window: number): Entry {
    const entry = this.entries.get(key);
    if (!entry || entry.window < window - 1) return { window, current: 0, previous: 0 };
    if (entry.window === window - 1) return { window, current: 0, previous: entry.current };
    return entry;
  }

  /** At most once per window: drops the keys whose counters no longer weigh anything. */
  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    const window = Math.floor(now / this.windowMs);
    for (const [key, entry] of this.entries) {
      if (entry.window < window - 1) this.entries.delete(key);
    }
  }
}
