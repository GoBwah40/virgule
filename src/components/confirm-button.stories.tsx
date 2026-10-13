import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmButton } from "./confirm-button";

const meta = {
  title: "Components/ConfirmButton",
  component: ConfirmButton,
  args: {
    children: "End the session",
    title: "End the session?",
    description: "Once the session is over, nobody can suggest or vote anymore.",
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { variant: "destructive" } };
export const DestructiveConfirm: Story = { args: { variant: "outline", destructive: true, children: "Leave the session" } };
/** Inside a dialog: the question replaces the button, no second dialog on top. */
export const Inline: Story = {
  args: { inline: true, variant: "outline", destructive: true, children: "Turn off the link", title: "Turn off the link?", description: "It stops working for everyone who has it." },
};
