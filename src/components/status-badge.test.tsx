import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("expose le détail des votes aux lecteurs d'écran sans l'afficher", () => {
    renderUi(<StatusBadge status="retained" label="Retenue" tooltip="Score +2 · 2 pour, 0 contre" />);
    const badge = screen.getByLabelText("Retenue · Score +2 · 2 pour, 0 contre");
    expect(badge).toHaveTextContent("Retenue");
    expect(badge).not.toHaveTextContent("2 pour");
  });

  it("s'affiche sans infobulle", () => {
    renderUi(<StatusBadge status="rejected" label="Écartée" />);
    expect(screen.getByText("Écartée")).toBeInTheDocument();
  });
});
