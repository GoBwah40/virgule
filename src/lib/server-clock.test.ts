import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  measureOffset,
  pickSample,
  recordClockSample,
  renderOffset,
  resetServerClock,
  serverNow,
  subscribeServerClock,
} from "./server-clock";

describe("measureOffset", () => {
  it("takes the server's clock as read halfway through the request", () => {
    // Sent at 1000, back at 1400 (device clock); the server read 61200: 60 s ahead.
    expect(measureOffset(61_200, 1000, 1400)).toEqual({ offset: 60_000, uncertainty: 200 });
  });

  it("works for a device clock ahead of the server's", () => {
    expect(measureOffset(1000, 300_000, 300_100)).toEqual({ offset: -299_050, uncertainty: 50 });
  });

  it("never gives a negative uncertainty, even if the device clock went backwards", () => {
    expect(measureOffset(5000, 1000, 900).uncertainty).toBe(0);
  });
});

describe("renderOffset", () => {
  it("compares the render time with the arrival, without knowing how long it took", () => {
    expect(renderOffset(90_000, 30_000)).toEqual({ offset: 60_000, uncertainty: Infinity });
  });
});

describe("pickSample", () => {
  const precise = { offset: 60_000, uncertainty: 50 };

  it("takes the first estimate there is", () => {
    expect(pickSample(null, precise)).toBe(precise);
  });

  it("keeps the more precise estimate when they agree", () => {
    const rough = { offset: 60_200, uncertainty: 400 };
    expect(pickSample(precise, rough)).toBe(precise);
    expect(pickSample(rough, precise)).toBe(precise);
  });

  it("keeps a measured estimate over a page render", () => {
    expect(pickSample(precise, renderOffset(100_000, 30_000))).toBe(precise);
  });

  it("replaces one page render by the next", () => {
    const next = renderOffset(100_000, 30_000);
    expect(pickSample(renderOffset(90_000, 30_000), next)).toBe(next);
  });

  it("follows a device clock that changed, even with a less precise estimate", () => {
    // Clock set right meanwhile: 60 s off before, now on time.
    const changed = { offset: 100, uncertainty: 400 };
    expect(pickSample(precise, changed)).toBe(changed);
  });
});

describe("serverNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-12T10:00:00Z"));
  });
  afterEach(() => {
    resetServerClock();
    vi.useRealTimers();
  });

  it("is the device's clock until there is an estimate", () => {
    expect(serverNow()).toBe(Date.now());
  });

  it("adds the estimated offset to the device's clock", () => {
    recordClockSample({ offset: -90_000, uncertainty: 20 });
    expect(serverNow()).toBe(Date.now() - 90_000);
  });

  it("tells the subscribers when the estimate changes, and only then", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeServerClock(listener);
    recordClockSample({ offset: 5000, uncertainty: 20 });
    expect(listener).toHaveBeenCalledTimes(1);
    // Less precise and in agreement: kept as it was.
    recordClockSample({ offset: 5010, uncertainty: 100 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    recordClockSample({ offset: 0, uncertainty: 10 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
