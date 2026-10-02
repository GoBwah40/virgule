import { describe, expect, it } from "vitest";

import { isNetworkError } from "./network-error";

describe("isNetworkError", () => {
  it.each(["Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource."])(
    "recognises a request lost to the network (%s)",
    (message) => expect(isNetworkError(new TypeError(message))).toBe(true),
  );

  it("lets any other error through", () => {
    expect(isNetworkError(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe(false);
    expect(isNetworkError(new Error("Failed to fetch"))).toBe(false);
    expect(isNetworkError(new DOMException("The operation was aborted.", "AbortError"))).toBe(false);
    expect(isNetworkError("Failed to fetch")).toBe(false);
  });
});
