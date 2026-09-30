import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { OverviewSummary } from "./overview-summary";

describe("OverviewSummary", () => {
  it("affiche la synthèse et sa précision", () => {
    renderUi(<OverviewSummary summary="Budget compatible : de 300 € à 400 €" detail="Commun aux 3 fourchettes retenues." common />);
    expect(screen.getByText("Budget compatible : de 300 € à 400 €")).toBeInTheDocument();
    expect(screen.getByText("Commun aux 3 fourchettes retenues.")).toBeInTheDocument();
  });
});
