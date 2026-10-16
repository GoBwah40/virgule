import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ConfirmButton } from "./confirm-button";

describe("ConfirmButton", () => {
  it("runs the action only after confirmation", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="End the session?" confirmLabel="End" onConfirm={onConfirm}>
        End the session
      </ConfirmButton>,
    );

    await userEvent.click(screen.getByRole("button", { name: "End the session" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(await screen.findByText("End the session?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "End" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("runs nothing when cancelled", async () => {
    const onConfirm = vi.fn();
    renderUi(
      <ConfirmButton title="End the session?" onConfirm={onConfirm}>
        End the session
      </ConfirmButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "End the session" }));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("waits with the loading mark in place of its label, and cannot be tapped again", () => {
    renderUi(
      <ConfirmButton title="End the session?" pending onConfirm={vi.fn()}>
        <svg data-icon="inline-start" />
        End the session
      </ConfirmButton>,
    );
    const button = screen.getByRole("button", { name: "End the session" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[data-slot=loading-mark]")).toBeInTheDocument();
  });

  describe("inline", () => {
    it("asks in place of the button, without a dialog", async () => {
      const onConfirm = vi.fn();
      renderUi(
        <ConfirmButton inline title="Turn off the link?" description="It stops working." confirmLabel="Turn off" onConfirm={onConfirm}>
          Turn off the link
        </ConfirmButton>,
      );

      await userEvent.click(screen.getByRole("button", { name: "Turn off the link" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Turn off the link" })).not.toBeInTheDocument();
      const group = screen.getByRole("group", { name: "Turn off the link?" });
      expect(group).toHaveAccessibleDescription("It stops working.");
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

      await userEvent.click(screen.getByRole("button", { name: "Turn off" }));
      expect(onConfirm).toHaveBeenCalledOnce();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });

    it("gives the button back, focused, when cancelled or on Escape", async () => {
      const onConfirm = vi.fn();
      renderUi(
        <ConfirmButton inline title="Turn off the link?" onConfirm={onConfirm}>
          Turn off the link
        </ConfirmButton>,
      );

      await userEvent.click(screen.getByRole("button", { name: "Turn off the link" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.getByRole("button", { name: "Turn off the link" })).toHaveFocus();

      await userEvent.click(screen.getByRole("button", { name: "Turn off the link" }));
      await userEvent.keyboard("{Escape}");
      expect(screen.getByRole("button", { name: "Turn off the link" })).toHaveFocus();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
