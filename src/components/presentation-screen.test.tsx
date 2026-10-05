import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationScreen } from "./presentation-screen";

const props = {
  appName: "Virgule",
  title: "Team retreat",
  stepsLabel: "Session steps",
  steps: [
    { id: "THEMES", label: "Topics" },
    { id: "IDEAS", label: "Ideas" },
    { id: "RECAP", label: "Recap" },
  ],
  current: 1,
  fullscreenHint: "Click or press a key to go full screen",
};

function stubFullscreen() {
  const requestFullscreen = vi.fn(() => Promise.resolve());
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
  document.documentElement.requestFullscreen = requestFullscreen;
  return requestFullscreen;
}

afterEach(() => {
  // @ts-expect-error: removed again after each test (jsdom has no fullscreen nor wake lock).
  delete document.fullscreenEnabled;
  // @ts-expect-error: same.
  delete document.fullscreenElement;
  // @ts-expect-error: same.
  delete navigator.wakeLock;
});

describe("PresentationScreen", () => {
  it("shows the session name, the current step and the content, always in dark", () => {
    const { container } = renderUi(
      <PresentationScreen {...props} footer={<p>4 people out of 6 have voted</p>}>
        <p>Content</p>
      </PresentationScreen>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Team retreat" })).toBeVisible();
    expect(screen.getByRole("list", { name: "Session steps" })).toBeVisible();
    expect(screen.getByText("Ideas")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Topics")).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("main")).toHaveTextContent("Content");
    expect(screen.getByText("4 people out of 6 have voted")).toBeVisible();
    expect(container.firstChild).toHaveAttribute("data-theme", "dark");
  });

  it("keeps the heading for screen readers when the name is already shown large", () => {
    renderUi(<PresentationScreen {...props} showTitle={false}>{null}</PresentationScreen>);
    expect(screen.getByRole("heading", { level: 1, name: "Team retreat" })).toHaveClass("sr-only");
  });

  it("goes full screen on the first gesture, and says so until then", () => {
    const requestFullscreen = stubFullscreen();
    renderUi(<PresentationScreen {...props}>{null}</PresentationScreen>);
    expect(screen.getByText(props.fullscreenHint)).toBeVisible();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(requestFullscreen).not.toHaveBeenCalled();
    fireEvent.pointerDown(window);
    expect(requestFullscreen).toHaveBeenCalledOnce();

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(screen.queryByText(props.fullscreenHint)).toBeNull();
  });

  it("shows no hint where full screen is not available", () => {
    renderUi(<PresentationScreen {...props}>{null}</PresentationScreen>);
    expect(screen.queryByText(props.fullscreenHint)).toBeNull();
  });

  it("keeps the screen awake, and lets go when it leaves", async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ release }));
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
    const { unmount } = renderUi(<PresentationScreen {...props}>{null}</PresentationScreen>);
    await act(async () => {});
    expect(request).toHaveBeenCalledWith("screen");
    unmount();
    expect(release).toHaveBeenCalled();
  });

  it("carries on when the browser refuses to keep the screen awake", async () => {
    const request = vi.fn(() => Promise.reject(new DOMException("Not allowed", "NotAllowedError")));
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
    renderUi(
      <PresentationScreen {...props}>
        <p>Content</p>
      </PresentationScreen>,
    );
    await act(async () => {});
    expect(screen.getByText("Content")).toBeVisible();
  });
});
