import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PhaseTransition } from "./phase-transition";

describe("PhaseTransition", () => {
  it("renders its content even without ViewTransition (stable React)", () => {
    renderUi(
      <PhaseTransition className="flex">
        <h2>The ideas</h2>
      </PhaseTransition>,
    );
    const heading = screen.getByRole("heading", { name: "The ideas" });
    expect(heading.parentElement).toHaveClass("flex");
  });
});
