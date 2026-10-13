import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { GuidedTour } from "./guided-tour";

const KEY = "virgule:tour:test";

const labels = {
  offerTitle: "First time hosting?",
  offerBody: "Take a quick tour.",
  start: "Take the tour",
  dismiss: "Not now",
  next: "Next",
  back: "Back",
  done: "Got it",
  quit: "Leave the tour",
  progress: (current: number, total: number) => `Step ${current} of ${total}`,
  replay: "Tour this page",
};

const steps = [
  { target: "one", title: "First", body: "The first element." },
  { target: "two", title: "Second", body: "The second element." },
  { target: "missing", title: "Missing", body: "Not on the page." },
];

/** Page elements the tour points at, with a size (jsdom lays nothing out). */
function addTargets(...targets: string[]) {
  for (const target of targets) {
    const el = document.createElement("div");
    el.dataset.tour = target;
    el.getBoundingClientRect = () => ({ top: 10, left: 10, bottom: 50, right: 110, width: 100, height: 40, x: 10, y: 10, toJSON: () => ({}) });
    el.scrollIntoView = vi.fn();
    document.body.append(el);
  }
}

beforeEach(() => {
  localStorage.clear();
  window.matchMedia ??= vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
  addTargets("one", "two");
});

afterEach(() => {
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
});

describe("GuidedTour", () => {
  it("offers the tour the first time, and not again once declined", async () => {
    const { unmount } = renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
    expect(screen.getByRole("dialog", { name: "First time hosting?" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tour this page" })).toBeInTheDocument();
  });

  it("walks through the steps on the page, skipping the missing ones", async () => {
    renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Take the tour" }));

    expect(await screen.findByRole("dialog", { name: "First" })).toHaveTextContent("Step 1 of 2");
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("dialog", { name: "Second" })).toHaveTextContent("Step 2 of 2");
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("dialog", { name: "First" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it("rings the element of the step", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    try {
      localStorage.setItem(KEY, "1");
      renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
      act(() => screen.getByRole("button", { name: "Tour this page" }).click());
      act(() => vi.advanceTimersToNextFrame());
      expect(screen.getByTestId("tour-ring")).toHaveStyle({ top: "4px", left: "4px", width: "112px", height: "52px" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("can be left at any step", async () => {
    renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Take the tour" }));
    await userEvent.click(await screen.findByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave the tour" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Escape", async () => {
    localStorage.setItem(KEY, "1");
    renderUi(<GuidedTour steps={steps} storageKey={KEY} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Tour this page" }));
    expect(await screen.findByRole("dialog", { name: "First" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
