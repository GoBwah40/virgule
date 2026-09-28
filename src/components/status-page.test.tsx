import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { StatusPage } from "./status-page";

describe("StatusPage", () => {
  it("affiche le message et l'action proposée", () => {
    renderUi(
      <StatusPage title="Séance introuvable" body="Le lien est peut-être incomplet.">
        <button type="button">Réessayer</button>
      </StatusPage>,
    );
    expect(screen.getByRole("heading", { name: "Séance introuvable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeInTheDocument();
  });
});
