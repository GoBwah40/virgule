import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PhaseStepper } from "./phase-stepper";

const steps = [
  { id: "THEMES", label: "Sujets" },
  { id: "IDEAS", label: "Idées" },
  { id: "RECAP", label: "Bilan" },
];

describe("PhaseStepper", () => {
  it("marque l'étape en cours", () => {
    renderUi(<PhaseStepper label="Étapes" steps={steps} current={1} />);
    expect(screen.getByText("Idées")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Sujets")).not.toHaveAttribute("aria-current");
  });

  it("aucune étape en cours une fois la séance terminée", () => {
    renderUi(<PhaseStepper label="Étapes" steps={steps} current={3} />);
    expect(screen.getByRole("list", { name: "Étapes" }).querySelector("[aria-current]")).toBeNull();
  });
});
