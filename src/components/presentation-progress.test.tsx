import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationProgress } from "./presentation-progress";

const props = { label: "4 people out of 6 have voted", completeLabel: "Everyone has voted", ariaLabel: "Participants who voted" };

describe("PresentationProgress", () => {
  it("shows the total as a progress bar", () => {
    const { container } = renderUi(<PresentationProgress value={3} max={6} {...props} />);
    const bar = screen.getByRole("progressbar", { name: "Participants who voted" });
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "6");
    expect(bar).toHaveTextContent(props.label);
    expect(container.querySelector('[style*="width: 50%"]')).not.toBeNull();
  });

  it("switches to the final label once everyone is done", () => {
    renderUi(<PresentationProgress value={6} max={6} {...props} />);
    expect(screen.getByRole("progressbar")).toHaveTextContent("Everyone has voted");
    expect(screen.getByRole("progressbar")).toHaveClass("text-success");
  });
});
