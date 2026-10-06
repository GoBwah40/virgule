import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { Countdown, formatRemaining } from "./countdown";

const labels = { running: "Time left", expired: "Time's up" };

describe("formatRemaining", () => {
  it("writes minutes and seconds, then hours beyond that", () => {
    expect(formatRemaining(245)).toBe("4:05");
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(3725)).toBe("1:02:05");
    expect(formatRemaining(-3)).toBe("0:00");
  });
});

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-12T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("counts down every second then announces the end", () => {
    renderUi(<Countdown endsAt="2027-06-12T10:00:02Z" labels={labels} />);
    expect(screen.getByRole("timer")).toHaveTextContent("0:02");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("0:01");
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("Time's up");
  });

  it("gives screen readers the time left once a minute, not every second", () => {
    const { container } = renderUi(<Countdown endsAt="2027-06-12T10:02:00Z" labels={labels} />);
    const live = () => container.querySelector("[aria-live]");
    expect(live()).toHaveTextContent("Time left 2:00");
    act(() => vi.advanceTimersByTime(30_000));
    expect(live()).toHaveTextContent("Time left 2:00");
    act(() => vi.advanceTimersByTime(30_000));
    expect(live()).toHaveTextContent("Time left 1:00");
  });
});

describe("Countdown, large", () => {
  it("grows to the room screen size", () => {
    renderUi(<Countdown endsAt={new Date(Date.now() + 60_000).toISOString()} labels={labels} size="lg" />);
    expect(screen.getByRole("timer")).toHaveClass("stage-md");
    expect(screen.getByRole("timer")).not.toHaveClass("text-sm");
  });
});
