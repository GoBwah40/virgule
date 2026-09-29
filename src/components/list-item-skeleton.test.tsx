import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ListItemSkeleton } from "./list-item-skeleton";

describe("ListItemSkeleton", () => {
  it("simule les deux boutons de vote", () => {
    const { container } = renderUi(
      <ul>
        <ListItemSkeleton actions="votes" />
      </ul>,
    );
    expect(container.querySelectorAll(".size-11")).toHaveLength(2);
  });
});
