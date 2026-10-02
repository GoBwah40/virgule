// What fetch() rejects with when the request never reaches the server, by browser:
// Chromium, Safari, Firefox.
const MESSAGES = ["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."];

/**
 * A request lost to the network (a dropped or switching connection), as opposed to any other
 * error, which must go through untouched.
 */
export const isNetworkError = (error: unknown) => error instanceof TypeError && MESSAGES.includes(error.message);
