// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ignoreSkippedViewTransitions } from "./ignore-skipped-view-transitions";

describe("ignoreSkippedViewTransitions", () => {
  // Each test adds listeners to the shared window: removed afterwards.
  const added: Parameters<typeof window.addEventListener>[] = [];
  // Stands for Next.js' development overlay, which listens after the inline script.
  const later = vi.fn();

  beforeEach(() => {
    const add = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((...args: Parameters<typeof window.addEventListener>) => {
      added.push(args);
      add(...args);
    });
    ignoreSkippedViewTransitions();
    window.addEventListener("unhandledrejection", later);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const args of added.splice(0)) window.removeEventListener(...args);
    later.mockReset();
  });

  /** Dispatches an unhandled rejection; true when it was cancelled (not reported). */
  const reject = (reason: unknown) => {
    const promise = Promise.resolve();
    const event = new PromiseRejectionEvent("unhandledrejection", { promise, reason, cancelable: true });
    return !window.dispatchEvent(event);
  };

  it("drops a view transition the browser could not capture", () => {
    expect(reject(new DOMException("Transition was aborted because of invalid state", "InvalidStateError"))).toBe(true);
    expect(later).not.toHaveBeenCalled();
  });

  it("drops one skipped because the page was hidden or resized", () => {
    for (const message of [
      "View transition was skipped because document visibility state is hidden.",
      "Skipping view transition because document visibility state has become hidden.",
      "Skipping view transition because viewport size changed.",
      // The same, in another browser version.
      "Transition was aborted because of invalid state. Viewport size changed",
    ]) {
      expect(reject(new DOMException(message, "InvalidStateError"))).toBe(true);
    }
    expect(later).not.toHaveBeenCalled();
  });

  it("lets any other invalid state through", () => {
    expect(reject(new DOMException("The object is in an invalid state.", "InvalidStateError"))).toBe(false);
    expect(later).toHaveBeenCalledTimes(1);
  });

  it("lets other errors with the same message through", () => {
    expect(reject(new Error("Transition was aborted because of invalid state"))).toBe(false);
    expect(reject(new DOMException("Transition was aborted because of invalid state", "AbortError"))).toBe(false);
    expect(later).toHaveBeenCalledTimes(2);
  });
});
