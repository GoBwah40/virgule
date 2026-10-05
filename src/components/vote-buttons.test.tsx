import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { VoteButtons } from "./vote-buttons";

const labels = { up: "For", down: "Against" };

describe("VoteButtons", () => {
  it("votes for, then removes the vote on a second click", async () => {
    const onChange = vi.fn();
    const { rerender } = renderUi(<VoteButtons value={null} onChange={onChange} labels={labels} />);

    await userEvent.click(screen.getByRole("button", { name: "For" }));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<VoteButtons value={true} onChange={onChange} labels={labels} />);
    expect(screen.getByRole("button", { name: "For" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "For" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("switches from for to against", async () => {
    const onChange = vi.fn();
    renderUi(<VoteButtons value={true} onChange={onChange} labels={labels} />);
    await userEvent.click(screen.getByRole("button", { name: "Against" }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("disables the buttons when a reason is given", async () => {
    const onChange = vi.fn();
    renderUi(<VoteButtons value={null} onChange={onChange} labels={labels} disabledReason="Voting disabled" />);
    expect(screen.getByRole("button", { name: "For" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Against" })).toBeDisabled();
  });

  it("shows a single button in pick mode, which picks then unpicks", async () => {
    const onChange = vi.fn();
    const { rerender } = renderUi(<VoteButtons mode="pick" value={null} onChange={onChange} labels={{ up: "Pick" }} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Pick" }));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<VoteButtons mode="pick" value={true} onChange={onChange} labels={{ up: "Pick" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Pick" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("can disable only the vote for, keeping an active vote removable", async () => {
    const onChange = vi.fn();
    const { rerender } = renderUi(
      <VoteButtons value={null} onChange={onChange} labels={labels} upDisabledReason="No votes left" />,
    );
    expect(screen.getByRole("button", { name: "For" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Against" })).toBeEnabled();
    expect(screen.getByLabelText("No votes left")).toBeInTheDocument();

    rerender(<VoteButtons value={true} onChange={onChange} labels={labels} upDisabledReason="No votes left" />);
    await userEvent.click(screen.getByRole("button", { name: "For" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
