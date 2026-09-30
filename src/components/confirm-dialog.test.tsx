import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ConfirmDialog } from "./confirm-dialog";

const props = { title: "Remove Leo?", confirmLabel: "Remove" };

describe("ConfirmDialog", () => {
  it("confirms then closes", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderUi(<ConfirmDialog open onOpenChange={onOpenChange} onConfirm={onConfirm} {...props} />);
    await userEvent.click(await screen.findByRole("button", { name: "Remove" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays closed until the parent opens it", () => {
    renderUi(<ConfirmDialog open={false} onOpenChange={() => {}} onConfirm={() => {}} {...props} />);
    expect(screen.queryByText("Remove Leo?")).toBeNull();
  });
});
