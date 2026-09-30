import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { VoteSummary } from "./vote-summary";

describe("VoteSummary", () => {
  it("affiche « pour » à gauche, « contre » à droite et une barre proportionnelle", () => {
    const { container } = renderUi(<VoteSummary up={3} down={1} labels={{ up: "3 pour", down: "1 contre" }} />);
    const [left, right] = screen.getByText("3 pour").parentElement!.children;
    expect(left).toHaveTextContent("3 pour");
    expect(right).toHaveTextContent("1 contre");
    const segments = container.querySelectorAll("[aria-hidden] > span");
    expect((segments[0] as HTMLElement).style.width).toBe("75%");
    expect((segments[1] as HTMLElement).style.width).toBe("25%");
  });

  it("laisse la barre vide sans vote", () => {
    const { container } = renderUi(<VoteSummary up={0} down={0} labels={{ up: "0 pour", down: "0 contre" }} />);
    expect(container.querySelectorAll("div[aria-hidden] > span")).toHaveLength(0);
  });
});
