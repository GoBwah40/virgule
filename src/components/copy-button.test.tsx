import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  it("copie l'URL absolue quand `absolute` est demandé", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderUi(<CopyButton value="/r/abc" absolute label="Copier le lien" successMessage="Lien copié" />);
    await user.click(screen.getByRole("button", { name: "Copier le lien" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/r/abc`);
  });

  it("garde un nom accessible quand le libellé est masqué sur mobile", () => {
    renderUi(<CopyButton value="x" label="Copier le lien" successMessage="ok" hideLabelOnMobile />);
    expect(screen.getByRole("button", { name: "Copier le lien" })).toBeInTheDocument();
  });
});
