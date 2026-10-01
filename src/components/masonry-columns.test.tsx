import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { MasonryColumns } from "./masonry-columns";

describe("MasonryColumns", () => {
  it("alternates blocks between two columns and keeps their order", () => {
    const { container } = renderUi(
      <MasonryColumns>
        {["One", "Two", "Three"].map((text) => (
          <p key={text}>{text}</p>
        ))}
      </MasonryColumns>,
    );
    const [left, right] = Array.from(container.firstElementChild!.children);
    expect(left).toHaveTextContent("OneThree");
    expect(right).toHaveTextContent("Two");
    // On phones, the original order is restored.
    expect(screen.getByText("Three").parentElement).toHaveStyle({ order: "2" });
  });
});
