import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("shows the title, subtitle and actions", () => {
    renderUi(<PageHeader title="The recap" subtitle="2 ideas kept" actions={<button type="button">Export</button>} />);
    expect(screen.getByRole("heading", { name: "The recap" })).toBeInTheDocument();
    expect(screen.getByText("2 ideas kept")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});
