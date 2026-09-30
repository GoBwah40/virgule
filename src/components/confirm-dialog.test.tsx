import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ConfirmDialog } from "./confirm-dialog";

const props = { title: "Retirer Léo ?", confirmLabel: "Retirer" };

describe("ConfirmDialog", () => {
  it("confirme puis se ferme", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderUi(<ConfirmDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} {...props} />);
    await userEvent.click(await screen.findByRole("button", { name: "Retirer" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("reste fermé tant que le parent ne l'ouvre pas", () => {
    renderUi(<ConfirmDialog open={false} onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
    expect(screen.queryByText("Retirer Léo ?")).toBeNull();
  });
});
