import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ReleaseNotesSheet } from "./release-notes-sheet";

const labels = {
  trigger: "What's new",
  unread: "New version",
  title: "What's new",
  description: "What changed, version by version.",
  close: "Close",
  latest: "Latest",
  categories: { added: "Added", improved: "Improved", fixed: "Fixed" },
};

const releases = [
  { version: "0.2.0", date: "October 2, 2026", changes: { added: ["Timer"], improved: [], fixed: ["Dark mode"] } },
  { version: "0.1.0", date: "September 28, 2026", changes: { added: ["First version"], improved: [], fixed: [] } },
];

describe("ReleaseNotesSheet", () => {
  it("shows the version and flags a new version", () => {
    renderUi(<ReleaseNotesSheet version="0.2.0" releases={releases} unread labels={labels} />);
    const trigger = screen.getByRole("button", { name: /What's new/ });
    expect(trigger).toHaveTextContent("v0.2.0");
    expect(trigger).toHaveTextContent("New version");
  });

  it("opens the notes, grouped by version and category, without empty categories", async () => {
    const onOpenChange = vi.fn();
    renderUi(<ReleaseNotesSheet version="0.2.0" releases={releases} labels={labels} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: /What's new/ }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    const dialog = await screen.findByRole("dialog", { name: "What's new" });
    const latest = screen.getByRole("region", { name: /v0\.2\.0/ });
    expect(latest).toHaveTextContent("Latest");
    expect(latest).toHaveTextContent("Timer");
    expect(latest).toHaveTextContent("Fixed");
    expect(latest).not.toHaveTextContent("Improved");
    expect(screen.getByRole("region", { name: /v0\.1\.0/ })).not.toHaveTextContent("Latest");
    expect(dialog).toHaveTextContent("First version");
  });
});
