/**
 * Calls `fn` at most once every `gapMs`: the first call goes through at once, later ones within
 * the gap are folded into a single call at its end, so the last one is never lost. Used for
 * catching up (tab shown again, connection back): a phone flipping between tabs or a connection
 * that keeps dropping must not refresh the page in a loop.
 */
export function throttle(fn: () => void, gapMs: number) {
  let last = -Infinity;
  let pending: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    pending = undefined;
    last = Date.now();
    fn();
  };
  return {
    call() {
      if (pending) return;
      const wait = last + gapMs - Date.now();
      if (wait <= 0) run();
      else pending = setTimeout(run, wait);
    },
    cancel() {
      clearTimeout(pending);
      pending = undefined;
    },
  };
}

/**
 * Follows the realtime connection's states (Pusher's `state_change`) and says when it is back
 * after having been lost: notifications sent meanwhile never arrived. The first connection is
 * not a comeback: the page has just been rendered.
 */
export function reconnectWatch() {
  let connectedOnce = false;
  let lost = false;
  return (state: string) => {
    if (state !== "connected") {
      lost = connectedOnce;
      return false;
    }
    const back = lost;
    connectedOnce = true;
    lost = false;
    return back;
  };
}
