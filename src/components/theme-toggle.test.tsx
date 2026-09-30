import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ThemeToggle } from "./theme-toggle";

const labels = { group: "Theme", system: "Same as device", light: "Light", dark: "Dark" };

describe("ThemeToggle", () => {
  it("checks the current preference", () => {
    renderUi(<ThemeToggle value="dark" onChange={() => {}} labels={labels} />);
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
  });

  it("reports the new choice", async () => {
    const onChange = vi.fn();
    renderUi(<ThemeToggle value="system" onChange={onChange} labels={labels} />);
    await userEvent.click(screen.getByRole("radio", { name: "Light" }));
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
