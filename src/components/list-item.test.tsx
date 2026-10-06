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

  it("shows content below the row when given", () => {
    renderUi(
      <ul>
        <ListItem below={<p>Two comments</p>}>Community hall</ListItem>
      </ul>,
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Two comments");
  });
});
