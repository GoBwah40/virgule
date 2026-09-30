import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ThemeToggle } from "./theme-toggle";

const labels = { group: "Thème", system: "Comme l'appareil", light: "Clair", dark: "Sombre" };

describe("ThemeToggle", () => {
  it("coche la préférence courante", () => {
    renderUi(<ThemeToggle value="dark" onChange={() => {}} labels={labels} />);
    expect(screen.getByRole("group", { name: "Thème" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sombre" })).toBeChecked();
  });

  it("signale le nouveau choix", async () => {
    const onChange = vi.fn();
    renderUi(<ThemeToggle value="system" onChange={onChange} labels={labels} />);
    await userEvent.click(screen.getByRole("radio", { name: "Clair" }));
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
