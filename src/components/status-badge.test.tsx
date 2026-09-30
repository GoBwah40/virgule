import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("affiche le statut retenu", () => {
    renderUi(<StatusBadge status="retained" label="Retenue" />);
    expect(screen.getByText("Retenue")).toBeInTheDocument();
  });

  it("affiche le statut écarté, sans élément focusable (il peut vivre dans un bouton)", () => {
    const { container } = renderUi(<StatusBadge status="rejected" label="Écartée" />);
    expect(screen.getByText("Écartée")).toBeInTheDocument();
    expect(container.querySelector("[tabindex], button, a")).toBeNull();
  });
});
