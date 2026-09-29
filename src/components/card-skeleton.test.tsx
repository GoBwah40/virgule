import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { CardSkeleton } from "./card-skeleton";

describe("CardSkeleton", () => {
  it("affiche le nombre de lignes demandé et le champ d'ajout", () => {
    const { container } = renderUi(<CardSkeleton rows={3} withComposer />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(container.querySelector("[data-slot=card-footer]")).not.toBeNull();
  });

  it("n'affiche pas de liste sans lignes", () => {
    renderUi(<CardSkeleton rows={0} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
