import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { OptionListField } from "./option-list-field";

const labels = {
  label: "Options",
  hint: "Entre 2 et 10 options.",
  placeholder: "Ex. : Mer",
  add: "Ajouter l'option",
  remove: (option: string) => `Retirer l'option « ${option} »`,
};

describe("OptionListField", () => {
  it("ajoute une option avec Entrée et ignore un doublon", async () => {
    const onChange = vi.fn();
    renderUi(<OptionListField idPrefix="t" value={["Mer"]} onChange={onChange} labels={labels} max={10} maxLength={60} />);
    const input = screen.getByLabelText("Options");
    await userEvent.type(input, "mer");
    expect(screen.getByRole("button", { name: "Ajouter l'option" })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, " Montagne {Enter}");
    expect(onChange).toHaveBeenCalledWith(["Mer", "Montagne"]);
  });

  it("retire une option", async () => {
    const onChange = vi.fn();
    renderUi(<OptionListField idPrefix="t" value={["Mer", "Ville"]} onChange={onChange} labels={labels} max={10} maxLength={60} />);
    await userEvent.click(screen.getByRole("button", { name: "Retirer l'option « Mer »" }));
    expect(onChange).toHaveBeenCalledWith(["Ville"]);
  });

  it("bloque la saisie une fois le maximum atteint", () => {
    renderUi(<OptionListField idPrefix="t" value={["Mer", "Ville"]} onChange={() => {}} labels={labels} max={2} maxLength={60} />);
    expect(screen.getByLabelText("Options")).toBeDisabled();
  });
});
