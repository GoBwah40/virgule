import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { Logo } from "./logo";

describe("Logo", () => {
  it("se lit comme une seule image nommée", () => {
    renderUi(<Logo label="Virgule" />);
    expect(screen.getByRole("img", { name: "Virgule" })).toHaveTextContent("Virgule");
  });

  it("n'affiche que la virgule en variante symbole", () => {
    renderUi(<Logo label="Virgule" variant="mark" />);
    expect(screen.getByRole("img", { name: "Virgule" })).toHaveTextContent("");
  });
});
