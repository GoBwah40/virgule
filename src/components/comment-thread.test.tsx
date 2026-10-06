import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderUi } from "@/test/render";

import { CommentThread } from "./comment-thread";

const labels = {
  list: "Comments on Pizza",
  mine: "Your comment",
  remove: "Remove my comment",
  moderate: { button: "Remove this comment", title: "Remove this comment?" },
};

const comments = [
  { id: "c1", content: "Open on Sundays?", isMine: false, canDelete: false },
  { id: "c2", content: "Vegetarian menu too", isMine: true, canDelete: true },
];

const form = (overrides: Partial<React.ComponentProps<typeof CommentThread>["form"] & object> = {}) => ({
  label: "Your comment",
  placeholder: "A detail…",
  submit: "Send",
  maxLength: 140,
  pending: false,
  onSubmit: vi.fn(),
  ...overrides,
});

describe("CommentThread", () => {
  it("lists the comments and marks only one's own", () => {
    renderUi(<CommentThread comments={comments} labels={labels} />);
    const list = screen.getByRole("list", { name: "Comments on Pizza" });
    const [other, mine] = within(list).getAllByRole("listitem");
    expect(other).toHaveTextContent("Open on Sundays?");
    expect(other).not.toHaveTextContent("Your comment");
    expect(mine).toHaveTextContent("Your comment");
  });

  it("removes one's own comment at once", async () => {
    const onDelete = vi.fn();
    renderUi(<CommentThread comments={comments} labels={labels} onDelete={onDelete} />);
    // Only one's own comment can be removed here.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Remove my comment" }));
    expect(onDelete).toHaveBeenCalledWith("c2");
  });

  it("asks before the host removes someone else's comment", async () => {
    const onDelete = vi.fn();
    const all = comments.map((comment) => ({ ...comment, canDelete: true }));
    renderUi(<CommentThread comments={all} labels={labels} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove this comment" }));
    expect(onDelete).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove this comment" }));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });

  it("sends a comment and empties the field", async () => {
    const onSubmit = vi.fn((_content: string, reset: () => void) => reset());
    renderUi(<CommentThread comments={[]} labels={labels} form={form({ onSubmit })} />);
    const field = screen.getByRole("textbox", { name: "Your comment" });
    expect(field).toHaveAttribute("maxlength", "140");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await userEvent.type(field, "Booked already?{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Booked already?", expect.any(Function));
    expect(field).toHaveValue("");
  });

  it("says why no more comment can be added", () => {
    renderUi(<CommentThread comments={comments} labels={labels} form={form({ disabledReason: "Limit reached" })} />);
    expect(screen.getByRole("textbox", { name: "Your comment" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Your comment" })).toHaveAccessibleDescription("Limit reached");
  });

  it("is read-only without callbacks: no input, nothing to remove", () => {
    renderUi(<CommentThread comments={comments} labels={{ list: labels.list, mine: labels.mine }} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
