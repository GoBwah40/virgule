import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ProgressMeter } from "./progress-meter";

const props = { label: "2 people out of 4 have voted", completeLabel: "Everyone has voted", ariaLabel: "Participants who voted" };

describe("ProgressMeter", () => {
  it("shows progress and exposes it as a progress bar", () => {
    renderUi(<ProgressMeter value={2} max={4} {...props} />);
    const bar = screen.getByRole("progressbar", { name: "Participants who voted" });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(bar).toHaveTextContent("2 people out of 4 have voted");
  });

  it("switches to the final label once everything is done", () => {
    renderUi(<ProgressMeter value={4} max={4} {...props} />);
    expect(screen.getByRole("progressbar")).toHaveTextContent("Everyone has voted");
  });

  it("replaces the dots with a bar above 10", () => {
    const { container } = renderUi(<ProgressMeter value={5} max={20} {...props} />);
    expect(container.querySelector('[style*="width: 25%"]')).not.toBeNull();
  });
});
