import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { AmountOverview } from "./amount-overview";

describe("AmountOverview", () => {
  it("places the ranges on a scale graduated in euros", () => {
    const { container } = renderUi(
      <AmountOverview
        ranges={[
          { min: 200, max: 400 },
          { min: 300, max: 500 },
        ]}
        best={{ start: 300, end: 400 }}
        locale="en"
        labels={{ range: "A range", zone: "Compatible zone", amounts: "Ranges" }}
      />,
    );
    expect(screen.getByRole("img", { name: "Ranges" })).toBeInTheDocument();
    // Ticks every €200, scale from €0 to €600: the zone starts halfway.
    expect(container.querySelector('[style*="left: 50%"]')).not.toBeNull();
    expect(container).toHaveTextContent("€600");
  });
});
