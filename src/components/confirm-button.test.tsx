import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ConfirmButton } from "./confirm-button";

describe("ConfirmButton", () => {
  it("runs the action only after confirmation", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="Is it decided?" confirmLabel="End" onConfirm={onConfirm}>
        End the session
      </ConfirmButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "End the session" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(await screen.findByText("Is it decided?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "End" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("runs nothing when cancelled", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="Is it decided?" onConfirm={onConfirm}>
        End the session
      </ConfirmButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "End the session" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
