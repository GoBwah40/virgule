import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmButton } from "./confirm-button";

const meta = {
  title: "Composants/ConfirmButton",
  component: ConfirmButton,
  args: {
    children: "Terminer la séance",
    title: "C'est décidé ?",
    description: "Une fois la séance terminée, plus personne ne pourra proposer ni voter.",
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructif: Story = { args: { variant: "destructive" } };
