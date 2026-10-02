/**
 * Runs inline in the <head>, before anything else. When the network drops while a page is
 * loading, its scripts or styles fail: the server-rendered skeleton stays on screen for good,
 * without styles or working buttons. Such a page reloads by itself as soon as the device is
 * back online. Failures after the page has loaded (a lazy chunk while offline) do not count:
 * the page works, and a reload would lose what is being typed.
 */
export function reloadWhenBackOnline() {
  let failed = false;
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      const resource = target instanceof HTMLScriptElement || target instanceof HTMLLinkElement;
      if (resource && document.readyState !== "complete") failed = true;
    },
    // Load errors do not bubble: listen during capture.
    true,
  );
  window.addEventListener("online", () => {
    if (failed) location.reload();
  });
}

export const RELOAD_WHEN_BACK_ONLINE_SCRIPT = `(${reloadWhenBackOnline.toString()})()`;
