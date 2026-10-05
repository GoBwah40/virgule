import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { CountBadge } from "./count-badge";

describe("CountBadge", () => {
  it("shows a plain count, without a check", () => {
    const { container } = renderUi(<CountBadge label="14 ideas" />);
    expect(screen.getByText("14 ideas")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("highlights what is left to do", () => {
    renderUi(<CountBadge label="3/14 voted" tone="progress" />);
    expect(screen.getByText("3/14 voted")).toHaveClass("bg-highlight-soft");
  });

  it("turns green with a decorative check once complete", () => {
    const { container } = renderUi(<CountBadge label="14/14 voted" tone="complete" />);
    expect(screen.getByText("14/14 voted")).toHaveClass("text-success");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
