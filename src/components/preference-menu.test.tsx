import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Globe } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { PreferenceMenu } from "./preference-menu";

const options = [
  { value: "en", label: "English", lang: "en" },
  { value: "fr", label: "Français", lang: "fr" },
];

describe("PreferenceMenu", () => {
  it("names the setting and its current choice on the trigger", () => {
    renderUi(<PreferenceMenu value="fr" options={options} onChange={() => {}} label="Language" icon={Globe} showValue />);
    expect(screen.getByRole("button", { name: "Language, Français" })).toBeInTheDocument();
  });

  it("keeps the current choice for screen readers when only the icon shows", () => {
    renderUi(<PreferenceMenu value="en" options={options} onChange={() => {}} label="Language" icon={Globe} />);
    expect(screen.getByRole("button", { name: "Language, English" })).toBeInTheDocument();
  });

  it("checks the current choice and reports the new one", async () => {
    const onChange = vi.fn();
    renderUi(<PreferenceMenu value="en" options={options} onChange={onChange} label="Language" icon={Globe} showValue />);
    await userEvent.click(screen.getByRole("button", { name: "Language, English" }));
    expect(await screen.findByRole("menuitemradio", { name: "English" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Français" }));
    expect(onChange).toHaveBeenCalledWith("fr");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
