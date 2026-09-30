import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmDialog } from "./confirm-dialog";

const meta = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    title: "Remove Leo from the session?",
    description: "Their ideas and votes are deleted. Leo can come back with the link if a seat is still free.",
    confirmLabel: "Remove from the session",
    destructive: true,
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destructive: Story = {};
export const Simple: Story = {
  args: {
    title: "Hand over hosting to Leo?",
    description: "Leo will run the steps. You stay in the session as a participant.",
    confirmLabel: "Hand over hosting",
    destructive: false,
  },
};
