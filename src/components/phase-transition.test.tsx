import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PhaseTransition } from "./phase-transition";

describe("PhaseTransition", () => {
  it("rend son contenu même sans ViewTransition (React stable)", () => {
    renderUi(
      <PhaseTransition className="flex">
        <h2>Les idées</h2>
      </PhaseTransition>,
    );
    const heading = screen.getByRole("heading", { name: "Les idées" });
    expect(heading.parentElement).toHaveClass("flex");
  });
});
