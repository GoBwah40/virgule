import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("shows the kept status", () => {
    renderUi(<StatusBadge status="retained" label="Kept" />);
    expect(screen.getByText("Kept")).toBeInTheDocument();
  });

  it("shows the dropped status, with no focusable element (it can live inside a button)", () => {
    const { container } = renderUi(<StatusBadge status="rejected" label="Dropped" />);
    expect(screen.getByText("Dropped")).toBeInTheDocument();
    expect(container.querySelector("[tabindex], button, a")).toBeNull();
  });
});
