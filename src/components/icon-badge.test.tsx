import { screen } from "@testing-library/react";
import { CalendarRange } from "lucide-react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { IconBadge } from "./icon-badge";

describe("IconBadge", () => {
  it("affiche le libellé, l'icône restant décorative", () => {
    const { container } = renderUi(<IconBadge icon={CalendarRange} label="Période" />);
    expect(screen.getByText("Période")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
