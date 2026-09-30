import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { VoteSummary } from "./vote-summary";

describe("VoteSummary", () => {
  it("shows \"for\" on the left, \"against\" on the right and a proportional bar", () => {
    const { container } = renderUi(<VoteSummary up={3} down={1} labels={{ up: "3 for", down: "1 against" }} />);
    const [left, right] = screen.getByText("3 for").parentElement!.children;
    expect(left).toHaveTextContent("3 for");
    expect(right).toHaveTextContent("1 against");
    const segments = container.querySelectorAll("[aria-hidden] > span");
    expect((segments[0] as HTMLElement).style.width).toBe("75%");
    expect((segments[1] as HTMLElement).style.width).toBe("25%");
  });

  it("leaves the bar empty with no votes", () => {
    const { container } = renderUi(<VoteSummary up={0} down={0} labels={{ up: "0 for", down: "0 against" }} />);
    expect(container.querySelectorAll("div[aria-hidden] > span")).toHaveLength(0);
  });
});
