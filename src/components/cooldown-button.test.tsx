import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { CooldownButton } from "./cooldown-button";

const inSeconds = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

describe("CooldownButton", () => {
  afterEach(() => vi.useRealTimers());

  it("runs the action when there is no wait", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderUi(<CooldownButton label="Remind" doneLabel="Sent" availableAt={null} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Remind" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("says it is done and stays disabled during the wait", () => {
    renderUi(<CooldownButton label="Remind" doneLabel="Sent" availableAt={inSeconds(30)} />);
    expect(screen.getByRole("button", { name: "Sent" })).toBeDisabled();
  });

  it("comes back by itself once the wait is over", () => {
    vi.useFakeTimers();
    renderUi(<CooldownButton label="Remind" doneLabel="Sent" availableAt={inSeconds(30)} />);
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.getByRole("button", { name: "Remind" })).toBeEnabled();
  });

  it("ignores a wait already over", () => {
    renderUi(<CooldownButton label="Remind" doneLabel="Sent" availableAt={inSeconds(-5)} />);
    expect(screen.getByRole("button", { name: "Remind" })).toBeEnabled();
  });

  it("is disabled while the action runs", () => {
    renderUi(<CooldownButton label="Remind" doneLabel="Sent" availableAt={null} pending />);
    expect(screen.getByRole("button", { name: "Remind" })).toBeDisabled();
  });
});
