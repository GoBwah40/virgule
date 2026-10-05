import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationTopics } from "./presentation-topics";

describe("PresentationTopics", () => {
  it("shows each topic with its kind and description when it has them", () => {
    renderUi(
      <PresentationTopics
        title="What we need to decide"
        topics={[
          { id: "1", title: "Where to?", description: "Near Lyon", kindLabel: "Place" },
          { id: "2", title: "What do we cook?" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "What we need to decide" })).toBeVisible();
    const [place, cook] = screen.getAllByRole("listitem");
    expect(within(place).getByRole("heading", { name: "Where to?" })).toBeVisible();
    expect(place).toHaveTextContent("Place");
    expect(place).toHaveTextContent("Near Lyon");
    expect(cook.textContent).toBe("What do we cook?");
  });
});
