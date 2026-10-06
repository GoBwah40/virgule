/**
 * Runs inline in the <head>, before anything else. When a page streams in, React's own inline
 * script reveals each loading boundary (`loading.tsx`) with a view transition, then chains
 * `transition.ready.finally(…)` without catching. The browser skips a view transition it cannot
 * capture: a tab or panel in the background, or the viewport resizing during the load (a phone's
 * address bar). `ready` then rejects, the derived promise too, and the console shows
 * "Uncaught (in promise) InvalidStateError" (in development, Next.js also counts it as an issue).
 * Nothing is broken: the content is revealed without animation. These rejections are dropped,
 * the ones React itself ignores on the client (worded differently across browser versions:
 * "Transition was aborted because of invalid state[. Viewport size changed]", "Skipping view
 * transition because…"); any other one goes through as usual.
 */
export function ignoreSkippedViewTransitions() {
  const skipped = /^Transition was aborted because of invalid state|view transition/i;
  window.addEventListener("unhandledrejection", (event) => {
    const reason: unknown = event.reason;
    if (reason instanceof DOMException && reason.name === "InvalidStateError" && skipped.test(reason.message)) {
      event.preventDefault();
      // Registered first: Next.js' development overlay, listening after us, does not see it either.
      event.stopImmediatePropagation();
    }
  });
}

export const IGNORE_SKIPPED_VIEW_TRANSITIONS_SCRIPT = `(${ignoreSkippedViewTransitions.toString()})()`;
