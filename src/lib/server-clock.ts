/**
 * The server's clock, as seen from this device. Timer ends (the ideas countdown, a pairing
 * code) are server times: a phone whose own clock is off would show the wrong time left.
 * Each estimate is an offset to add to `Date.now()`, with how far off it may be.
 */
export type ClockSample = {
  /** Server time minus device time, in milliseconds. */
  offset: number;
  /** How far the estimate may be from the truth (ms); `Infinity` when unknown. */
  uncertainty: number;
};

/**
 * Offset from a request: the server read its clock somewhere between sending and receiving.
 * Assuming halfway (same time out and back), the error is at most half the round trip.
 */
export function measureOffset(serverNow: number, sentAt: number, receivedAt: number): ClockSample {
  const roundTrip = Math.max(0, receivedAt - sentAt);
  return { offset: serverNow - (sentAt + roundTrip / 2), uncertainty: roundTrip / 2 };
}

/**
 * Offset from a page render: the time it took to reach the device is unknown, but small next to
 * a clock several minutes off. Only used until a request has been measured.
 */
export function renderOffset(serverNow: number, receivedAt: number): ClockSample {
  return { offset: serverNow - receivedAt, uncertainty: Infinity };
}

/**
 * Keeps the more precise of two estimates, unless they disagree beyond their uncertainties:
 * the device clock has changed meanwhile (set by hand, synced on waking up), the new one wins.
 */
export function pickSample(current: ClockSample | null, next: ClockSample): ClockSample {
  if (!current) return next;
  const disagree = Math.abs(next.offset - current.offset) > next.uncertainty + current.uncertainty;
  return disagree || next.uncertainty <= current.uncertainty ? next : current;
}

let sample: ClockSample | null = null;
const listeners = new Set<() => void>();

/** Records an estimate (from `measureOffset` or `renderOffset`) and tells the clocks on screen. */
export function recordClockSample(next: ClockSample) {
  const picked = pickSample(sample, next);
  if (picked === sample) return;
  const changed = picked.offset !== sample?.offset;
  sample = picked;
  if (changed) listeners.forEach((listener) => listener());
}

/** Called whenever the estimate changes. */
export function subscribeServerClock(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The server's current time, in milliseconds; the device's own until an estimate comes in. */
export function serverNow() {
  return Date.now() + (sample?.offset ?? 0);
}

/** Forgets the estimate (tests). */
export function resetServerClock() {
  sample = null;
}
