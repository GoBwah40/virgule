import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { Rosette } from "./rosette";

describe("Rosette", () => {
  it("dessine une virgule par place, en décor", () => {
    const { container } = renderUi(<Rosette />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("path")).toHaveLength(6);
  });
});
