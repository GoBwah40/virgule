import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PhaseStepper } from "./phase-stepper";

const steps = [
  { id: "THEMES", label: "Topics" },
  { id: "IDEAS", label: "Ideas" },
  { id: "RECAP", label: "Recap" },
];

describe("PhaseStepper", () => {
  it("marks the current step", () => {
    renderUi(<PhaseStepper label="Steps" steps={steps} current={1} />);
    expect(screen.getByText("Ideas")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Topics")).not.toHaveAttribute("aria-current");
  });

  it("has no current step once the session is over", () => {
    renderUi(<PhaseStepper label="Steps" steps={steps} current={3} />);
    expect(screen.getByRole("list", { name: "Steps" }).querySelector("[aria-current]")).toBeNull();
  });
});
