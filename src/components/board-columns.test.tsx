import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { BoardColumns } from "./board-columns";

describe("BoardColumns", () => {
  it("lays its blocks out in order, as a grid of equal columns from tablets up", () => {
    const { container } = renderUi(
      <BoardColumns>
        <p key="a">Dates</p>
        <p key="b">Place</p>
      </BoardColumns>,
    );
    expect(screen.getAllByText(/Dates|Place/).map((block) => block.textContent)).toEqual(["Dates", "Place"]);
    expect(container.firstChild).toHaveClass("grid", "md:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]");
  });
});

describe("BoardColumns, as a list", () => {
  it("renders a list for list items", () => {
    renderUi(
      <BoardColumns as="ul">
        <li key="a">Dates</li>
      </BoardColumns>,
    );
    expect(screen.getByRole("list")).toContainElement(screen.getByRole("listitem"));
  });
});
