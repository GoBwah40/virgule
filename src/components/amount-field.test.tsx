import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { AmountField } from "./amount-field";

const labels = { amount: "Montant", min: "Entre", max: "Et", currency: "€" };

describe("AmountField", () => {
  it("ne garde que les chiffres (pas de décimales ni de signe)", () => {
    const onChange = vi.fn();
    renderUi(<AmountField mode="single" idPrefix="t" labels={labels} value={{ min: "", max: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Montant (€)"), { target: { value: "-12,50 €" } });
    expect(onChange).toHaveBeenLastCalledWith({ min: "1250", max: "" });
  });

  it("fourchette : deux champs avec clavier numérique et unité annoncée", () => {
    renderUi(<AmountField mode="range" idPrefix="t" labels={labels} value={{ min: "300", max: "500" }} onChange={() => {}} />);
    expect(screen.getByLabelText("Entre (€)")).toHaveAttribute("inputmode", "numeric");
    expect(screen.getByLabelText("Et (€)")).toHaveValue("500");
  });
});
