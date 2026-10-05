import { screen } from "@testing-library/react";
import { CalendarRange, Vote } from "lucide-react";
import { describe, expect, it } from "vitest";

import { renderUi } from "@/test/render";

import { TopicCard } from "./topic-card";

describe("TopicCard", () => {
  it("shows the kind, the title, the description and the actions", () => {
    renderUi(
      <ul>
        <TopicCard
          title="When do we leave?"
          description="Two days in June"
          badges={[
            { label: "Period", icon: CalendarRange },
            { label: "2 votes each", icon: Vote },
          ]}
          actions={<button type="button">Edit</button>}
        />
      </ul>,
    );
    const card = screen.getByRole("listitem");
    expect(screen.getByRole("heading", { name: "When do we leave?" })).toHaveClass("wrap-break-word");
    expect(card).toHaveTextContent("Period");
    expect(card).toHaveTextContent("2 votes each");
    expect(card).toHaveTextContent("Two days in June");
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  it("is a title alone for a free-text topic", () => {
    renderUi(
      <ul>
        <TopicCard title="What do we cook?" />
      </ul>,
    );
    expect(screen.getByRole("listitem").textContent).toBe("What do we cook?");
  });
});
