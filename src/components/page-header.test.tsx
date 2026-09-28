import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("affiche le titre, le sous-titre et les actions", () => {
    renderUi(<PageHeader title="Le bilan" subtitle="2 idées retenues" actions={<button type="button">Exporter</button>} />);
    expect(screen.getByRole("heading", { name: "Le bilan" })).toBeInTheDocument();
    expect(screen.getByText("2 idées retenues")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exporter" })).toBeInTheDocument();
  });
});
