import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("relie le libellé au contrôle et affiche l'aide", () => {
    renderUi(
      <FormField id="session" label="Nom de la séance" hint="Visible par tous">
        <input id="session" />
      </FormField>,
    );
    expect(screen.getByLabelText("Nom de la séance")).toHaveAttribute("id", "session");
    expect(screen.getByText("Visible par tous")).toBeInTheDocument();
  });
});
