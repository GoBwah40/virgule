import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SuggestionChips } from "./suggestion-chips";

describe("SuggestionChips", () => {
  it("transmet l'identifiant de la suggestion choisie", async () => {
    const onSelect = vi.fn();
    renderUi(
      <SuggestionChips
        label="Idées de sujets"
        items={[
          { id: "dates", label: "Dates" },
          { id: "budget", label: "Budget" },
        ]}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Budget" }));
    expect(onSelect).toHaveBeenCalledWith("budget");
  });

  it("ne rend rien quand il n'y a plus de suggestion", () => {
    renderUi(<SuggestionChips label="Idées de sujets" items={[]} onSelect={() => {}} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
