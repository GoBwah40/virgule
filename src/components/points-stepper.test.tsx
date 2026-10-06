import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { PointsStepper } from "./points-stepper";

const labels = (value: number) => ({
  decrease: "One point less",
  increase: "One point more",
  value: `${value} points`,
  group: "Your points",
});

describe("PointsStepper", () => {
  it("adds and removes one point at a time", async () => {
    const onChange = vi.fn();
    const { rerender } = renderUi(<PointsStepper value={0} max={5} onChange={onChange} labels={labels(0)} />);
    expect(screen.getByRole("button", { name: "One point less" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "One point more" }));
    expect(onChange).toHaveBeenLastCalledWith(1);

    rerender(<PointsStepper value={3} max={5} onChange={onChange} labels={labels(3)} />);
    expect(screen.getByRole("group", { name: "Your points" })).toHaveTextContent("3");
    expect(screen.getByLabelText("3 points")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "One point less" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("stops at the most the idea can get, saying why", () => {
    renderUi(
      <PointsStepper value={2} max={2} onChange={vi.fn()} labels={labels(2)} increaseDisabledReason="No points left" />,
    );
    expect(screen.getByRole("button", { name: "One point more" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "One point less" })).toBeEnabled();
    expect(screen.getByLabelText("No points left")).toBeInTheDocument();
  });

  it("disables both buttons when a reason is given", () => {
    renderUi(<PointsStepper value={0} max={5} onChange={vi.fn()} labels={labels(0)} disabledReason="Not on your own ideas" />);
    expect(screen.getByRole("button", { name: "One point more" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "One point less" })).toBeDisabled();
    expect(screen.getByLabelText("Not on your own ideas")).toBeInTheDocument();
  });
});
