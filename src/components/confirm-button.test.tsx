import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ConfirmButton } from "./confirm-button";

describe("ConfirmButton", () => {
  it("n'exécute l'action qu'après confirmation", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="C'est décidé ?" confirmLabel="Terminer" onConfirm={onConfirm}>
        Terminer la séance
      </ConfirmButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Terminer la séance" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(await screen.findByText("C'est décidé ?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Terminer" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("n'exécute rien si on annule", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="C'est décidé ?" onConfirm={onConfirm}>
        Terminer la séance
      </ConfirmButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Terminer la séance" }));
    await userEvent.click(await screen.findByRole("button", { name: "Annuler" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
