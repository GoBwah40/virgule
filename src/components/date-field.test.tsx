import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { DateField } from "./date-field";

const labels = { date: "Date", from: "From", to: "To" };

describe("DateField", () => {
  it("period: the end date follows the start when the start passes it", () => {
    const onChange = vi.fn();
    renderUi(<DateField mode="range" idPrefix="t" labels={labels} value={{ start: "2027-06-12", end: "2027-06-14" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2027-06-20" } });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2027-06-20", end: "2027-06-20" });
  });

  it("period: prevents picking an end before the start", () => {
    renderUi(<DateField mode="range" idPrefix="t" labels={labels} value={{ start: "2027-06-12", end: "" }} onChange={() => {}} />);
    expect(screen.getByLabelText("To")).toHaveAttribute("min", "2027-06-12");
  });

  it("single date: one field only", () => {
    renderUi(<DateField mode="single" idPrefix="t" labels={labels} value={{ start: "", end: "" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
    expect(screen.queryByLabelText("To")).not.toBeInTheDocument();
  });
});
