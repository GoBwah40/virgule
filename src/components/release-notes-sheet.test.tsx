import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ReleaseNotesSheet } from "./release-notes-sheet";

const labels = {
  trigger: "Nouveautés",
  unread: "Nouvelle version",
  title: "Nouveautés",
  description: "Ce qui a changé, version par version.",
  close: "Fermer",
  latest: "Dernière",
  categories: { added: "Ajouts", improved: "Améliorations", fixed: "Corrections" },
};

const releases = [
  { version: "0.2.0", date: "2 octobre 2026", changes: { added: ["Minuteur"], improved: [], fixed: ["Mode sombre"] } },
  { version: "0.1.0", date: "28 septembre 2026", changes: { added: ["Première version"], improved: [], fixed: [] } },
];

describe("ReleaseNotesSheet", () => {
  it("affiche la version et signale une nouvelle version", () => {
    renderUi(<ReleaseNotesSheet version="0.2.0" releases={releases} unread labels={labels} />);
    const trigger = screen.getByRole("button", { name: /Nouveautés/ });
    expect(trigger).toHaveTextContent("v0.2.0");
    expect(trigger).toHaveTextContent("Nouvelle version");
  });

  it("ouvre les notes, classées par version et par catégorie, sans catégorie vide", async () => {
    const onOpenChange = vi.fn();
    renderUi(<ReleaseNotesSheet version="0.2.0" releases={releases} labels={labels} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Nouveautés/ }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    const dialog = await screen.findByRole("dialog", { name: "Nouveautés" });
    const latest = screen.getByRole("region", { name: /v0\.2\.0/ });
    expect(latest).toHaveTextContent("Dernière");
    expect(latest).toHaveTextContent("Minuteur");
    expect(latest).toHaveTextContent("Corrections");
    expect(latest).not.toHaveTextContent("Améliorations");
    expect(screen.getByRole("region", { name: /v0\.1\.0/ })).not.toHaveTextContent("Dernière");
    expect(dialog).toHaveTextContent("Première version");
  });
});
