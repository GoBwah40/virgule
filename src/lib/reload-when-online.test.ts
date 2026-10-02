// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reloadWhenBackOnline } from "./reload-when-online";

describe("reloadWhenBackOnline", () => {
  const reload = vi.fn();
  let readyState: DocumentReadyState;
  // Each test adds listeners to the shared window: removed afterwards.
  const added: Parameters<typeof window.addEventListener>[] = [];

  beforeEach(() => {
    readyState = "loading";
    const add = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((...args: Parameters<typeof window.addEventListener>) => {
      added.push(args);
      add(...args);
    });
    vi.spyOn(document, "readyState", "get").mockImplementation(() => readyState);
    vi.stubGlobal("location", { reload });
    reloadWhenBackOnline();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const args of added.splice(0)) window.removeEventListener(...args);
    vi.unstubAllGlobals();
    reload.mockReset();
  });

  const fail = (element: Element) => {
    document.head.append(element);
    element.dispatchEvent(new Event("error"));
  };
  const backOnline = () => window.dispatchEvent(new Event("online"));

  it("reloads once back online when a script failed during loading", () => {
    fail(document.createElement("script"));
    backOnline();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads when a stylesheet failed during loading", () => {
    fail(document.createElement("link"));
    backOnline();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("leaves a page that loaded fine alone", () => {
    backOnline();
    expect(reload).not.toHaveBeenCalled();
  });

  it("ignores failures once the page has loaded, so nothing being typed is lost", () => {
    readyState = "complete";
    fail(document.createElement("script"));
    backOnline();
    expect(reload).not.toHaveBeenCalled();
  });

  it("ignores runtime errors, which are not about the network", () => {
    window.dispatchEvent(new ErrorEvent("error", { message: "boom" }));
    backOnline();
    expect(reload).not.toHaveBeenCalled();
  });
});
