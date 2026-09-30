import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { CopyButton } from "./copy-button";

describe("CopyButton", () => {
  it("copies the absolute URL when `absolute` is set", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    renderUi(<CopyButton value="/r/abc" absolute label="Copy the link" successMessage="Link copied" />);
    await user.click(screen.getByRole("button", { name: "Copy the link" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/r/abc`);
  });

  it("keeps an accessible name when the label is hidden on mobile", () => {
    renderUi(<CopyButton value="x" label="Copy the link" successMessage="ok" hideLabelOnMobile />);
    expect(screen.getByRole("button", { name: "Copy the link" })).toBeInTheDocument();
  });
});
