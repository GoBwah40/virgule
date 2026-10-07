import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryRateLimiter } from "@/lib/memory-rate-limit";

const MINUTE = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  // At the start of a window: the previous one weighs fully, as in the worst case.
  vi.setSystemTime(new Date("2026-10-07T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

const useUp = (limiter: MemoryRateLimiter, key: string, times: number) => {
  for (let i = 0; i < times; i++) expect(limiter.limit(key)).toBe(true);
};

describe("MemoryRateLimiter", () => {
  it("allows the quota, then refuses", () => {
    const limiter = new MemoryRateLimiter(3, MINUTE);
    useUp(limiter, "a", 3);
    expect(limiter.limit("a")).toBe(false);
  });

  it("counts each key on its own", () => {
    const limiter = new MemoryRateLimiter(2, MINUTE);
    useUp(limiter, "a", 2);
    expect(limiter.limit("a")).toBe(false);
    expect(limiter.limit("b")).toBe(true);
  });

  it("does not count refused requests", () => {
    const limiter = new MemoryRateLimiter(2, MINUTE);
    useUp(limiter, "a", 2);
    for (let i = 0; i < 10; i++) limiter.limit("a");
    vi.advanceTimersByTime(2 * MINUTE);
    useUp(limiter, "a", 2);
  });

  it("slides: the previous window still weighs for the part it overlaps", () => {
    const limiter = new MemoryRateLimiter(10, MINUTE);
    useUp(limiter, "a", 10);
    // Halfway through the next window, half of the previous 10 still count.
    vi.advanceTimersByTime(1.5 * MINUTE);
    useUp(limiter, "a", 5);
    expect(limiter.limit("a")).toBe(false);
  });

  it("forgets everything after two windows", () => {
    const limiter = new MemoryRateLimiter(3, MINUTE);
    useUp(limiter, "a", 3);
    vi.advanceTimersByTime(2 * MINUTE);
    useUp(limiter, "a", 3);
    expect(limiter.limit("a")).toBe(false);
  });

  it("prunes keys that no longer weigh anything", () => {
    const limiter = new MemoryRateLimiter(3, MINUTE);
    for (let i = 0; i < 50; i++) limiter.limit(`ip-${i}`);
    expect(limiter.size).toBe(50);
    vi.advanceTimersByTime(2 * MINUTE);
    limiter.limit("late");
    expect(limiter.size).toBe(1);
  });

  it("keeps at most maxKeys, dropping the least recently used", () => {
    const limiter = new MemoryRateLimiter(1, MINUTE, 3);
    limiter.limit("a");
    limiter.limit("b");
    limiter.limit("c");
    limiter.limit("d");
    expect(limiter.size).toBe(3);
    // "a" was dropped: it can go again; "d" is still counted.
    expect(limiter.limit("a")).toBe(true);
    expect(limiter.limit("d")).toBe(false);
  });
});
