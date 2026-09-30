import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { OverviewSummary } from "./overview-summary";

describe("OverviewSummary", () => {
  it("shows the summary and its detail", () => {
    renderUi(<OverviewSummary summary="Compatible budget: €300 to €400" detail="Shared by all 3 ranges kept." common />);
    expect(screen.getByText("Compatible budget: €300 to €400")).toBeInTheDocument();
    expect(screen.getByText("Shared by all 3 ranges kept.")).toBeInTheDocument();
  });
});
