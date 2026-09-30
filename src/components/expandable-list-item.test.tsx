import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ExpandableListItem } from "./expandable-list-item";

const renderItem = () =>
  renderUi(
    <ul>
      <ExpandableListItem aside={<span>Retenue</span>} details={<p>4 pour · 1 contre</p>}>
        Salle des fêtes
      </ExpandableListItem>
    </ul>,
  );

describe("ExpandableListItem", () => {
  it("est repliée par défaut : le détail n'est pas visible", () => {
    renderItem();
    expect(screen.getByRole("button", { name: /Salle des fêtes/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("4 pour · 1 contre")).not.toBeVisible();
  });

  it("se déplie et se replie au toucher", async () => {
    renderItem();
    const row = screen.getByRole("button", { name: /Salle des fêtes/ });
    await userEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("4 pour · 1 contre")).toBeVisible();
    await userEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "false");
  });

  it("se déplie au clavier", async () => {
    renderItem();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("4 pour · 1 contre")).toBeVisible();
  });
});
