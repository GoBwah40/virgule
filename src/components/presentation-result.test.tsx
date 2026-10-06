import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationResult } from "./presentation-result";

const idea = (id: string, content: string, up: number, down: number, qualified: boolean) => ({
  id,
  content,
  up,
  down,
  qualified,
  votesLabel: `${up} for, ${down} against`,
  statusLabel: qualified ? "Kept" : "Dropped",
});

describe("PresentationResult", () => {
  it("shows the kept idea in large, then the ranking with its votes", () => {
    const { container } = renderUi(
      <PresentationResult
        topic="Where to?"
        winners={["Annecy"]}
        verdict="Kept by the group"
        ideas={[idea("1", "Annecy", 3, 1, true), idea("2", "Chamonix", 0, 2, false)]}
        moreLabel="+ 2 more ideas"
      />,
    );
    expect(screen.getByRole("heading", { name: "Where to?" })).toBeVisible();
    expect(screen.getByText("Kept by the group")).toBeVisible();
    const [winner] = screen.getAllByRole("list")[0].querySelectorAll("li");
    expect(winner).toHaveTextContent("Annecy");
    expect(winner).toHaveClass("stage-xl");

    const ranking = screen.getAllByRole("listitem").slice(1);
    expect(ranking[0]).toHaveTextContent("Annecy · Kept3 for, 1 against");
    expect(ranking[1]).toHaveTextContent("Chamonix · Dropped0 for, 2 against");
    expect(container.querySelector('[style*="width: 75%"]')).not.toBeNull();
    expect(screen.getByText("+ 2 more ideas")).toBeVisible();
  });

  it("shows tied ideas side by side, a size down", () => {
    renderUi(
      <PresentationResult
        topic="Where to?"
        winners={["Annecy", "Chamonix"]}
        verdict="Tied for first"
        ideas={[idea("1", "Annecy", 2, 0, true), idea("2", "Chamonix", 2, 0, true)]}
      />,
    );
    const winners = screen.getAllByRole("list")[0].querySelectorAll("li");
    expect(winners).toHaveLength(2);
    expect(winners[0]).toHaveClass("stage-lg");
  });

  it("says when nothing was kept", () => {
    renderUi(<PresentationResult topic="Where to?" winners={[]} verdict="No idea kept on this topic" ideas={[]} />);
    expect(screen.getByText("No idea kept on this topic")).toBeVisible();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("PresentationResult, long idea", () => {
  it("sets a long kept idea smaller, so that it fits the screen", () => {
    const long = `https://example.com/${"a".repeat(200)}`;
    renderUi(<PresentationResult topic="Links" winners={[long]} verdict="Kept by the group" ideas={[]} />);
    expect(screen.getByText(long)).toHaveClass("stage-md");
  });
});

describe("PresentationResult, in the recap page", () => {
  it("sits in a card at page sizes, its topic in a colour that reads on light", () => {
    const { container } = renderUi(
      <PresentationResult topic="Where to?" winners={["Annecy"]} verdict="Kept by the group" ideas={[]} variant="page" />,
    );
    expect(container.firstChild).toHaveClass("bg-card");
    expect(screen.getByRole("heading", { name: "Where to?" })).toHaveClass("text-primary");
    expect(screen.getByText("Annecy")).toHaveClass("text-5xl");
    expect(screen.getByText("Annecy")).not.toHaveClass("stage-xl");
  });
});

describe("PresentationResult, points topic", () => {
  it("measures the bars against the leading idea, with no share against", () => {
    const { container } = renderUi(
      <PresentationResult
        topic="Where to?"
        winners={["Annecy"]}
        verdict="Kept by the group"
        pointsMax={8}
        ideas={[
          { ...idea("1", "Annecy", 8, 0, true), votesLabel: "8 points" },
          { ...idea("2", "Chamonix", 2, 0, true), votesLabel: "2 points" },
        ]}
      />,
    );
    expect(screen.getByText("2 points")).toBeVisible();
    expect(container.querySelector('[style*="width: 100%"]')).not.toBeNull();
    expect(container.querySelector('[style*="width: 25%"]')).not.toBeNull();
    expect(container.querySelector(".bg-destructive")).toBeNull();
  });
});
