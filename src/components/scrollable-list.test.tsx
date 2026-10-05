import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ScrollableList } from "./scrollable-list";

/** jsdom does no layout: sizes are set by hand. */
function setSizes(el: HTMLElement, sizes: { scrollHeight: number; clientHeight: number }) {
  Object.defineProperty(el, "scrollHeight", { configurable: true, value: sizes.scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, value: sizes.clientHeight });
  Object.defineProperty(el, "scrollTop", { configurable: true, writable: true, value: 0 });
}

const rows = (n: number) => Array.from({ length: n }, (_, i) => <li key={i}>Idea {i + 1}</li>);

/** Adds a row on click, like an idea arriving. */
function Growing() {
  const [count, setCount] = useState(3);
  return (
    <>
      <ScrollableList label="Ideas">{rows(count)}</ScrollableList>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Add
      </button>
    </>
  );
}

describe("ScrollableList", () => {
  it("renders a named list with its rows", () => {
    renderUi(<ScrollableList label="Ideas">{rows(3)}</ScrollableList>);
    const list = screen.getByRole("list", { name: "Ideas" });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(list).toHaveClass("overflow-y-auto");
  });

  it("is not focusable while everything fits", () => {
    renderUi(<ScrollableList label="Ideas">{rows(2)}</ScrollableList>);
    expect(screen.getByRole("list")).not.toHaveAttribute("tabindex");
  });

  it("follows a new row when scrolled to the bottom", async () => {
    renderUi(<Growing />);
    const list = screen.getByRole("list");
    setSizes(list, { scrollHeight: 900, clientHeight: 400 });
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(list.scrollTop).toBe(900);
    // It now overflows: keyboard users can reach it to scroll.
    expect(list).toHaveAttribute("tabindex", "0");
  });
});
