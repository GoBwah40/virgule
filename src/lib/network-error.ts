// What fetch() rejects with when the request never reaches the server, by browser:
// Chromium, Safari, Firefox.
const MESSAGES = ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."];

/**
 * A request lost to the network (a dropped or switching connection), as opposed to any other
 * error, which must go through untouched.
 */
export const isNetworkError = (error: unknown) => error instanceof TypeError && MESSAGES.includes(error.message);

// What Next.js throws when a server action gets something else than its own answer (an
// overloaded server or proxy sending an HTML error page). A plain-text error body becomes the
// message instead, and cannot be told apart: that case still shows the step's error page.
const BAD_RESPONSE = "An unexpected response was received from the server.";

/** A server action answered by something else than the app (server overloaded, proxy error). */
export const isBadServerResponse = (error: unknown) => error instanceof Error && error.message === BAD_RESPONSE;
