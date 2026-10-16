import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Flag } from "lucide-react";
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
const withIcon = (
  <>
    <Flag data-icon="inline-start" />
    End the session
  </>
);

export const WithIcon: Story = { args: { children: withIcon } };
/** Confirmed, waiting for the server: the loading mark in place of the label. */
export const Pending: Story = { args: { pending: true, children: withIcon } };
export const Destructive: Story = { args: { variant: "destructive" } };
export const DestructiveConfirm: Story = { args: { variant: "outline", destructive: true, children: "Leave the session" } };
/** Inside a dialog: the question replaces the button, no second dialog on top. */
export const Inline: Story = {
  args: { inline: true, variant: "outline", destructive: true, children: "Turn off the link", title: "Turn off the link?", description: "It stops working for everyone who has it." },
};
