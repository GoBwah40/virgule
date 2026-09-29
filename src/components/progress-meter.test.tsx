import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ProgressMeter } from "./progress-meter";

const props = { label: "2 personnes sur 4 ont voté", completeLabel: "Tout le monde a voté", ariaLabel: "Participants ayant voté" };

describe("ProgressMeter", () => {
  it("affiche l'avancement et l'expose comme une barre de progression", () => {
    renderUi(<ProgressMeter value={2} max={4} {...props} />);
    const bar = screen.getByRole("progressbar", { name: "Participants ayant voté" });
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(bar).toHaveTextContent("2 personnes sur 4 ont voté");
  });

  it("passe au libellé final quand tout est fait", () => {
    renderUi(<ProgressMeter value={4} max={4} {...props} />);
    expect(screen.getByRole("progressbar")).toHaveTextContent("Tout le monde a voté");
  });
});
