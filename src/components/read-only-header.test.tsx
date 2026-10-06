import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { ReadOnlyHeader } from "./read-only-header";

describe("ReadOnlyHeader", () => {
  it("gives the page its heading, says it is read-only and links back home", () => {
    renderUi(<ReadOnlyHeader logoLabel="Virgule" title="Friday night" subtitle="Shared by Sam" note="Read-only" />);
    expect(screen.getByRole("heading", { level: 1, name: "Friday night" })).toBeInTheDocument();
    expect(screen.getByText("Shared by Sam")).toBeInTheDocument();
    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Virgule" })).toHaveAttribute("href", "/");
  });
});
