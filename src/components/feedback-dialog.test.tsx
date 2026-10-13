import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { FeedbackDialog, type FeedbackValues } from "./feedback-dialog";

const labels = {
  trigger: "Feedback",
  title: "An idea or a bug?",
  description: "Your message is public.",
  kind: "Type",
  idea: "Idea",
  bug: "Bug",
  titleField: "In a few words",
  descriptionField: "Details",
  details: "Attach technical details",
  detailsHint: "Version, browser.",
  submit: "Send",
  close: "Close",
};
const maxLength = { title: 100, description: 2000 };

async function open(onSubmit: (values: FeedbackValues, done: () => void) => void = vi.fn(), pending = false) {
  const user = userEvent.setup();
  renderUi(<FeedbackDialog maxLength={maxLength} labels={labels} pending={pending} onSubmit={onSubmit} />);
  await user.click(screen.getByRole("button", { name: "Feedback" }));
  await screen.findByLabelText("In a few words");
  return user;
}

describe("FeedbackDialog", () => {
  it("sends a trimmed bug report with the technical details", async () => {
    const onSubmit = vi.fn();
    const user = await open(onSubmit);
    await user.click(screen.getByRole("radio", { name: "Bug" }));
    await user.type(screen.getByLabelText("In a few words"), "  Vote stuck  ");
    await user.type(screen.getByLabelText("Details"), "The button stays grey.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith(
      { kind: "bug", title: "Vote stuck", description: "The button stays grey.", includeDetails: true, website: "" },
      expect.any(Function),
    );
  });

  it("can leave the technical details out", async () => {
    const onSubmit = vi.fn();
    const user = await open(onSubmit);
    await user.type(screen.getByLabelText("In a few words"), "Dark mode");
    await user.type(screen.getByLabelText("Details"), "Please.");
    await user.click(screen.getByRole("switch", { name: "Attach technical details" }));
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ kind: "idea", includeDetails: false }), expect.any(Function));
  });

  it("needs a title and details", async () => {
    const onSubmit = vi.fn();
    const user = await open(onSubmit);
    const submit = screen.getByRole("button", { name: "Send" });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("In a few words"), "Only a title");
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText("Details"), "   ");
    expect(submit).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("closes and empties the form once sent", async () => {
    const user = await open((_, done: () => void) => done());
    await user.type(screen.getByLabelText("In a few words"), "Dark mode");
    await user.type(screen.getByLabelText("Details"), "Please.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.queryByLabelText("In a few words")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Feedback" }));
    expect(await screen.findByLabelText("In a few words")).toHaveValue("");
  });

  it("keeps the length limits and stays disabled while sending", async () => {
    const user = await open(vi.fn(), true);
    expect(screen.getByLabelText("In a few words")).toHaveAttribute("maxlength", "100");
    expect(screen.getByLabelText("Details")).toHaveAttribute("maxlength", "2000");
    await user.type(screen.getByLabelText("In a few words"), "Dark mode");
    await user.type(screen.getByLabelText("Details"), "Please.");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
