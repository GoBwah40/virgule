import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationCarousel } from "./presentation-carousel";

const props = {
  label: "Results by topic",
  slides: [<p key="a">Annecy</p>, <p key="b">June</p>, <p key="c">€200</p>],
  positions: ["Topic 1 of 3", "Topic 2 of 3", "Topic 3 of 3"],
  intervalMs: 1000,
};

const current = () => screen.getByRole("group").getAttribute("aria-label");

describe("PresentationCarousel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows one slide at a time and moves on by itself, back to the first after the last", () => {
    renderUi(<PresentationCarousel {...props} />);
    expect(screen.getByRole("region", { name: "Results by topic" })).toHaveTextContent("Annecy");
    expect(screen.queryByText("June")).toBeNull();
    act(() => vi.advanceTimersByTime(1000));
    expect(current()).toBe("Topic 2 of 3");
    act(() => vi.advanceTimersByTime(2000));
    expect(current()).toBe("Topic 1 of 3");
  });

  it("follows the arrows and Page keys, and pauses on the space bar", () => {
    renderUi(<PresentationCarousel {...props} />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(current()).toBe("Topic 3 of 3");
    fireEvent.keyDown(window, { key: "PageDown" });
    expect(current()).toBe("Topic 1 of 3");
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(5000));
    expect(current()).toBe("Topic 1 of 3");
    fireEvent.keyDown(window, { key: " " });
    act(() => vi.advanceTimersByTime(1000));
    expect(current()).toBe("Topic 2 of 3");
  });

  it("stays put with a single slide, without a position", () => {
    renderUi(<PresentationCarousel {...props} slides={[<p key="a">Annecy</p>]} positions={["Topic 1 of 1"]} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("Annecy")).toBeVisible();
    expect(screen.queryByText("Topic 1 of 1")).toBeNull();
  });
});

describe("PresentationCarousel, on someone's own device", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("moves with its buttons only: no rotation, no page-wide keys", () => {
    renderUi(<PresentationCarousel {...props} controls={{ previous: "Previous topic", next: "Next topic" }} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(current()).toBe("Topic 1 of 3");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(current()).toBe("Topic 1 of 3");

    fireEvent.click(screen.getByRole("button", { name: "Next topic" }));
    expect(current()).toBe("Topic 2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Previous topic" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous topic" }));
    expect(current()).toBe("Topic 3 of 3");
  });
});
