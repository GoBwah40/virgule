import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { KeyFigures } from "./key-figures";

describe("KeyFigures", () => {
  it("affiche chaque chiffre avec son libellé", () => {
    renderUi(
      <KeyFigures
        items={[
          { value: 6, label: "places" },
          { value: 7, label: "jours en ligne" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent("7jours en ligne");
  });
});
