import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { Logo } from "./logo";

describe("Logo", () => {
  it("reads as a single named image", () => {
    renderUi(<Logo label="Virgule" />);
    expect(screen.getByRole("img", { name: "Virgule" })).toHaveTextContent("Virgule");
  });

  it("shows only the comma in the mark variant", () => {
    renderUi(<Logo label="Virgule" variant="mark" />);
    expect(screen.getByRole("img", { name: "Virgule" })).toHaveTextContent("");
  });
});
