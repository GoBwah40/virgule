import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { VoteButtons } from "./vote-buttons";

const labels = { up: "Pour", down: "Contre" };

describe("VoteButtons", () => {
  it("vote pour, puis retire le vote au second clic", async () => {
    const onChange = vi.fn();
    const { rerender } = renderUi(<VoteButtons value={null} onChange={onChange} labels={labels} />);

    await userEvent.click(screen.getByRole("button", { name: "Pour" }));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<VoteButtons value={true} onChange={onChange} labels={labels} />);
    expect(screen.getByRole("button", { name: "Pour" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Pour" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("passe de pour à contre", async () => {
    const onChange = vi.fn();
    renderUi(<VoteButtons value={true} onChange={onChange} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Contre" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("désactive les boutons quand une raison est donnée", async () => {
    const onChange = vi.fn();
    renderUi(<VoteButtons value={null} onChange={onChange} labels={labels} disabledReason="Vote désactivé" />);
    expect(screen.getByRole("button", { name: "Pour" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Contre" })).toBeDisabled();
  });
});
