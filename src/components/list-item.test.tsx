import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ListItem } from "./list-item";

describe("ListItem", () => {
  it("shows content, metadata and actions", () => {
    renderUi(
      <ul>
        <ListItem meta={<span>Your idea</span>} actions={<button type="button">For</button>}>
          Neighbourhood community hall
        </ListItem>
      </ul>,
    );
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Neighbourhood community hall");
    expect(item).toHaveTextContent("Your idea");
    expect(screen.getByRole("button", { name: "For" })).toBeInTheDocument();
  });
});
