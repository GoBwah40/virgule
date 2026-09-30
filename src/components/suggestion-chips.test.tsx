import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { SuggestionChips } from "./suggestion-chips";

describe("SuggestionChips", () => {
  it("passes on the id of the chosen suggestion", async () => {
    const onSelect = vi.fn();
    renderUi(
      <SuggestionChips
        label="Topic ideas"
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

  it("renders nothing when there are no suggestions left", () => {
    renderUi(<SuggestionChips label="Topic ideas" items={[]} onSelect={() => {}} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
