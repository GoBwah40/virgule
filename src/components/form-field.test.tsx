import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("links the label to the control and shows the hint", () => {
    renderUi(
      <FormField id="session" label="Session name" hint="Visible to everyone">
        <input id="session" />
      </FormField>,
    );
    expect(screen.getByLabelText("Session name")).toHaveAttribute("id", "session");
    expect(screen.getByText("Visible to everyone")).toBeInTheDocument();
  });
});
