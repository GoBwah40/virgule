import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { LocaleToggle } from "./locale-toggle";

const options = [
  { value: "en", short: "EN", name: "English" },
  { value: "fr", short: "FR", name: "Français" },
];

describe("LocaleToggle", () => {
  it("checks the current language, named in its own language", () => {
    renderUi(<LocaleToggle value="fr" options={options} onChange={() => {}} labels={{ group: "Language" }} />);
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Français" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "English" })).not.toBeChecked();
  });

  it("reports the new choice", async () => {
    const onChange = vi.fn();
    renderUi(<LocaleToggle value="en" options={options} onChange={onChange} labels={{ group: "Language" }} />);
    await userEvent.click(screen.getByRole("radio", { name: "Français" }));
    expect(onChange).toHaveBeenCalledWith("fr");
  });
});
