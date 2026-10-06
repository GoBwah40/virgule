import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  it("copies the absolute URL when `absolute` is set", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderUi(<CopyButton value="/r/abc" absolute label="Copy the link" successMessage="Link copied" errorMessage="Copy failed" />);
    await user.click(screen.getByRole("button", { name: "Copy the link" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/r/abc`);
  });

  it("says so when the browser refuses to copy", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    const error = vi.spyOn(toast, "error");
    renderUi(<CopyButton value="x" label="Copy the link" successMessage="Link copied" errorMessage="Copy failed" />);
    await user.click(screen.getByRole("button", { name: "Copy the link" }));
    expect(error).toHaveBeenCalledWith("Copy failed");
  });

  it("keeps an accessible name when the label is hidden on mobile", () => {
    renderUi(<CopyButton value="x" label="Copy the link" successMessage="ok" errorMessage="ko" hideLabelOnMobile />);
    expect(screen.getByRole("button", { name: "Copy the link" })).toBeInTheDocument();
  });
});
