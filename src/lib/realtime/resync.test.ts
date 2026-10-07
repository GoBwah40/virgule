import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reconnectWatch, throttle } from "./resync";

describe("throttle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("calls at once the first time", () => {
    const fn = vi.fn();
    throttle(fn, 2000).call();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("folds the calls within the gap into one at its end", () => {
    const fn = vi.fn();
    const { call } = throttle(fn, 2000);
    call();
    vi.advanceTimersByTime(500);
    call();
    call();
    call();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1499);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("refreshes at most once per gap, however often it is asked", () => {
    const fn = vi.fn();
    const { call } = throttle(fn, 2000);
    // A tab switched every 100 ms for 10 s.
    for (let i = 0; i < 100; i++) {
      call();
      vi.advanceTimersByTime(100);
    }
    expect(fn.mock.calls.length).toBeLessThanOrEqual(6);
  });

  it("calls at once again once the gap is over", () => {
    const fn = vi.fn();
    const { call } = throttle(fn, 2000);
    call();
    vi.advanceTimersByTime(2000);
    call();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("drops the waiting call when cancelled", () => {
    const fn = vi.fn();
    const { call, cancel } = throttle(fn, 2000);
    call();
    call();
    cancel();
    vi.advanceTimersByTime(5000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("reconnectWatch", () => {
  it("does not count the first connection", () => {
    const isComeback = reconnectWatch();
    expect(["connecting", "connected"].map(isComeback)).toEqual([false, false]);
  });

  it("says when the connection is back after being lost", () => {
    const isComeback = reconnectWatch();
    isComeback("connecting");
    isComeback("connected");
    expect(["unavailable", "connecting", "connected"].map(isComeback)).toEqual([false, false, true]);
  });

  it("says so again for every comeback", () => {
    const isComeback = reconnectWatch();
    isComeback("connected");
    expect(["connecting", "connected", "disconnected", "connected"].map(isComeback)).toEqual([false, true, false, true]);
  });

  it("does not count a first connection that took several attempts", () => {
    const isComeback = reconnectWatch();
    expect(["connecting", "unavailable", "connecting", "connected"].map(isComeback)).toEqual([false, false, false, false]);
  });
});
