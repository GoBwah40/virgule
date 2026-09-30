import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { AmountOverview } from "./amount-overview";

describe("AmountOverview", () => {
  it("place les fourchettes sur une échelle graduée en euros", () => {
    const { container } = renderUi(
      <AmountOverview
        ranges={[
          { min: 200, max: 400 },
          { min: 300, max: 500 },
        ]}
        best={{ start: 300, end: 400 }}
        locale="fr"
        labels={{ range: "Une fourchette", zone: "Zone compatible", amounts: "Fourchettes" }}
      />,
    );
    expect(screen.getByRole("img", { name: "Fourchettes" })).toBeInTheDocument();
    // Graduations tous les 200 €, échelle de 0 à 600 € : la zone commence à mi-chemin.
    expect(container.querySelector('[style*="left: 50%"]')).not.toBeNull();
    expect(container).toHaveTextContent(/600\s€/);
  });
});
