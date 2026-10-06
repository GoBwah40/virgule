import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CommentThread } from "./comment-thread";

const comments = [
  { id: "c1", content: "Is it open on Sundays?", isMine: false, canDelete: false },
  { id: "c2", content: "They have a vegetarian menu.", isMine: true, canDelete: true },
];

const form = {
  label: "Your comment on this idea",
  placeholder: "A detail, a question…",
  submit: "Send",
  maxLength: 140,
  pending: false,
  onSubmit: fn(),
};

const labels = {
  list: "Comments on “Pizza”",
  mine: "Your comment",
  remove: "Remove my comment",
  moderate: { button: "Remove this comment", title: "Remove this comment?", description: "It disappears for everyone." },
};

const meta = {
  title: "Components/CommentThread",
  component: CommentThread,
  decorators: [(Story) => <div className="max-w-md rounded-xl bg-muted p-3"><Story /></div>],
  args: { comments, labels, onDelete: fn(), form },
} satisfies Meta<typeof CommentThread>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A participant: they can remove their own comment only. */
export const Participant: Story = {};

/** The person hosting: they can remove anyone's comment, after a confirmation. */
export const Host: Story = {
  args: { comments: comments.map((comment) => ({ ...comment, canDelete: true })) },
};

export const Empty: Story = { args: { comments: [] } };

export const LimitReached: Story = {
  args: { form: { ...form, disabledReason: "You've left 3 comments on this idea, the most you can." } },
};

/** In the recap: read-only, no input and nothing to remove. */
export const ReadOnly: Story = {
  args: { onDelete: undefined, form: undefined, labels: { list: labels.list, mine: labels.mine } },
};
