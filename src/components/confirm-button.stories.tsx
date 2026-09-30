import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmButton } from "./confirm-button";

const meta = {
  title: "Components/ConfirmButton",
  component: ConfirmButton,
  args: {
    children: "End the session",
    title: "Is it decided?",
    description: "Once the session is over, nobody can suggest or vote anymore.",
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { variant: "destructive" } };
