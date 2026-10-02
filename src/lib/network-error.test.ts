import { describe, expect, it } from "vitest";

import { isBadServerResponse, isNetworkError } from "./network-error";

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

describe("isBadServerResponse", () => {
  it("recognises a server action answered by an error page", () => {
    expect(isBadServerResponse(new Error("An unexpected response was received from the server."))).toBe(true);
  });

  it("lets any other error through", () => {
    expect(isBadServerResponse(new Error("Service Unavailable"))).toBe(false);
    expect(isBadServerResponse(new TypeError("Failed to fetch"))).toBe(false);
    expect(isBadServerResponse("An unexpected response was received from the server.")).toBe(false);
  });
});
