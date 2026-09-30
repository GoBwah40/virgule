import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ExpandableListItem } from "./expandable-list-item";

const renderItem = () =>
  renderUi(
    <ul>
      <ExpandableListItem aside={<span>Kept</span>} details={<p>4 for · 1 against</p>}>
        Community hall
      </ExpandableListItem>
    </ul>,
  );

describe("ExpandableListItem", () => {
  it("is collapsed by default: the details are not visible", () => {
    renderItem();
    expect(screen.getByRole("button", { name: /Community hall/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("4 for · 1 against")).not.toBeVisible();
  });

  it("expands and collapses on tap", async () => {
    renderItem();
    const row = screen.getByRole("button", { name: /Community hall/ });
    await userEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("4 for · 1 against")).toBeVisible();
    await userEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "false");
  });

  it("expands with the keyboard", async () => {
    renderItem();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("4 for · 1 against")).toBeVisible();
  });
});
