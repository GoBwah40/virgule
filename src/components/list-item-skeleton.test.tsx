import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ListItemSkeleton } from "./list-item-skeleton";

describe("ListItemSkeleton", () => {
  it("mimics the two vote buttons", () => {
    const { container } = renderUi(
      <ul>
        <ListItemSkeleton actions="votes" />
      </ul>,
    );
    expect(container.querySelectorAll(".size-11")).toHaveLength(2);
  });
});
