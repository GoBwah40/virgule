import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { DateField } from "./date-field";

const labels = { date: "Date", from: "Du", to: "Au" };

describe("DateField", () => {
  it("période : la date de fin suit le début s'il la dépasse", () => {
    const onChange = vi.fn();
    renderUi(<DateField mode="range" idPrefix="t" labels={labels} value={{ start: "2027-06-12", end: "2027-06-14" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Du"), { target: { value: "2027-06-20" } });
    expect(onChange).toHaveBeenLastCalledWith({ start: "2027-06-20", end: "2027-06-20" });
  });

  it("période : empêche de choisir une fin avant le début", () => {
    renderUi(<DateField mode="range" idPrefix="t" labels={labels} value={{ start: "2027-06-12", end: "" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Au")).toHaveAttribute("min", "2027-06-12");
  });

  it("date unique : un seul champ", () => {
    renderUi(<DateField mode="single" idPrefix="t" labels={labels} value={{ start: "", end: "" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
    expect(screen.queryByLabelText("Au")).not.toBeInTheDocument();
  });
});
