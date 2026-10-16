import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { LoadingMark } from "./loading-mark";
import { Button } from "./ui/button";

describe("LoadingMark", () => {
  it("draws three commas hidden from screen readers", () => {
    const { container } = renderUi(<LoadingMark />);
    const mark = container.querySelector('[data-slot="loading-mark"]');
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(mark?.querySelectorAll("svg")).toHaveLength(3);
    expect(mark?.querySelector("svg")).toHaveClass("fill-brand");
  });

  it("follows the text color inside a button", () => {
    const { container } = renderUi(<LoadingMark tone="current" />);
    for (const comma of container.querySelectorAll("svg")) expect(comma).toHaveClass("fill-current");
  });

  it("replaces a pending button's label, which stays its accessible name", () => {
    renderUi(<Button pending>Start the ideas</Button>);
    const button = screen.getByRole("button", { name: "Start the ideas" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector('[data-slot="loading-mark"]')).not.toBeNull();
    // `visibility: hidden` would take the label out of the accessibility tree (jsdom doesn't see it).
    expect(button.querySelector(".invisible")).toBeNull();
  });

  it("leaves an idle button as it is", () => {
    renderUi(<Button>Start the ideas</Button>);
    const button = screen.getByRole("button", { name: "Start the ideas" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button.querySelector('[data-slot="loading-mark"]')).toBeNull();
  });
});
