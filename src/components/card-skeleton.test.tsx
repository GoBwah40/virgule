import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { CardSkeleton } from "./card-skeleton";

describe("CardSkeleton", () => {
  it("shows the requested number of rows and the add field", () => {
    const { container } = renderUi(<CardSkeleton rows={3} withComposer />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(container.querySelector("[data-slot=card-footer]")).not.toBeNull();
  });

  it("shows no list without rows", () => {
    renderUi(<CardSkeleton rows={0} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
