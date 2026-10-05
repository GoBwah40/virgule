import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { PresentationIdeas } from "./presentation-ideas";

describe("PresentationIdeas", () => {
  it("lists each topic's ideas, the latest first and outlined", () => {
    renderUi(
      <PresentationIdeas
        emptyLabel="Waiting for the first idea"
        topics={[
          {
            id: "1",
            title: "Where to?",
            countLabel: "2 ideas",
            ideas: [
              { id: "a", content: "Annecy" },
              { id: "b", content: "Chamonix" },
            ],
          },
          { id: "2", title: "How much?", countLabel: "No ideas yet", ideas: [] },
        ]}
      />,
    );
    const where = screen.getByRole("region", { name: "Where to?" });
    expect(where).toHaveTextContent("2 ideas");
    const ideas = within(where).getAllByRole("listitem");
    expect(ideas.map((idea) => idea.textContent)).toEqual(["Chamonix", "Annecy"]);
    expect(ideas[0]).toHaveClass("border-highlight");
    expect(ideas[1]).not.toHaveClass("border-highlight");

    expect(screen.getByRole("region", { name: "How much?" })).toHaveTextContent("Waiting for the first idea");
  });
});

describe("PresentationIdeas, headings", () => {
  it("puts the count under the title, so a narrow column never breaks a word to make room", () => {
    renderUi(
      <PresentationIdeas emptyLabel="Waiting" topics={[{ id: "1", title: "Feculent", countLabel: "No ideas yet", ideas: [] }]} />,
    );
    const title = screen.getByRole("heading", { name: "Feculent" });
    expect(title).toHaveClass("wrap-break-word");
    expect(title).not.toHaveClass("[overflow-wrap:anywhere]");
    expect(title.nextElementSibling).toHaveTextContent("No ideas yet");
    expect(title.parentElement).not.toHaveClass("flex");
  });
});
