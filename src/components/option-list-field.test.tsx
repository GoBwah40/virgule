import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { OptionListField } from "./option-list-field";

const labels = {
  label: "Options",
  hint: "Between 2 and 10 options.",
  placeholder: "E.g. Seaside",
  add: "Add the option",
  remove: (option: string) => `Remove the option “${option}”`,
};

describe("OptionListField", () => {
  it("adds an option with Enter and ignores a duplicate", async () => {
    const onChange = vi.fn();
    renderUi(<OptionListField idPrefix="t" value={["Seaside"]} onChange={onChange} labels={labels} max={10} maxLength={60} />);
    const input = screen.getByLabelText("Options");
    await userEvent.type(input, "seaside");
    expect(screen.getByRole("button", { name: "Add the option" })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, " Mountains {Enter}");
    expect(onChange).toHaveBeenCalledWith(["Seaside", "Mountains"]);
  });

  it("removes an option", async () => {
    const onChange = vi.fn();
    renderUi(<OptionListField idPrefix="t" value={["Seaside", "City"]} onChange={onChange} labels={labels} max={10} maxLength={60} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove the option “Seaside”" }));
    expect(onChange).toHaveBeenCalledWith(["City"]);
  });

  it("blocks input once the maximum is reached", () => {
    renderUi(<OptionListField idPrefix="t" value={["Seaside", "City"]} onChange={() => {}} labels={labels} max={2} maxLength={60} />);
    expect(screen.getByLabelText("Options")).toBeDisabled();
  });
});
