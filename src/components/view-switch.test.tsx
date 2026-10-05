import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { ViewSwitch } from "./view-switch";

const labels = { label: "Display", list: "List", board: "Board" };

describe("ViewSwitch", () => {
  it("shows the current layout and offers the other one", () => {
    const onChange = vi.fn();
    renderUi(<ViewSwitch value="list" onChange={onChange} labels={labels} />);
    expect(screen.getByRole("group", { name: "Display" })).toHaveClass("hidden", "md:grid");
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Board" }));
    expect(onChange).toHaveBeenCalledWith("board");
  });
});
