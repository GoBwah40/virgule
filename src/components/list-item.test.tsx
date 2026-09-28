import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ListItem } from "./list-item";

describe("ListItem", () => {
  it("affiche contenu, métadonnées et actions", () => {
    renderUi(
      <ul>
        <ListItem meta={<span>Ton idée</span>} actions={<button type="button">Pour</button>}>
          Salle des fêtes du quartier
        </ListItem>
      </ul>,
    );
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Salle des fêtes du quartier");
    expect(item).toHaveTextContent("Ton idée");
    expect(screen.getByRole("button", { name: "Pour" })).toBeInTheDocument();
  });
});
