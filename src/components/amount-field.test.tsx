import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { AmountField } from "./amount-field";

const labels = { amount: "Amount", min: "Between", max: "And", currency: "€" };

describe("AmountField", () => {
  it("keeps digits only (no decimals, no sign)", () => {
    const onChange = vi.fn();
    renderUi(<AmountField mode="single" idPrefix="t" labels={labels} value={{ min: "", max: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Amount (€)"), { target: { value: "-12,50 €" } });
    expect(onChange).toHaveBeenLastCalledWith({ min: "1250", max: "" });
  });

  it("range: two fields with a numeric keypad and an announced unit", () => {
    renderUi(<AmountField mode="range" idPrefix="t" labels={labels} value={{ min: "300", max: "500" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Between (€)")).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByLabelText("And (€)")).toHaveValue("500");
  });
});
