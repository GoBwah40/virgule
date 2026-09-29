import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PageHeaderSkeleton } from "./page-header-skeleton";

describe("PageHeaderSkeleton", () => {
  it("simule le nombre d'actions demandé", () => {
    const { container } = renderUi(<PageHeaderSkeleton actions={2} />);
    expect(container.querySelectorAll(".h-11")).toHaveLength(2);
  });
});
