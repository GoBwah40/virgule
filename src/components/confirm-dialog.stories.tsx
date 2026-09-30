import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmDialog } from "./confirm-dialog";

const meta = {
  title: "Composants/ConfirmDialog",
  component: ConfirmDialog,
  args: {
    open: true,
    onOpenChange: fn(),
    title: "Retirer Léo de la séance ?",
    description: "Ses idées et ses votes sont supprimés. Léo pourra revenir avec le lien s'il reste une place.",
    confirmLabel: "Retirer de la séance",
    destructive: true,
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destructif: Story = {};
export const Simple: Story = {
  args: {
    title: "Confier l'animation à Léo ?",
    description: "Léo pilotera les étapes. Tu restes dans la séance comme participant.",
    confirmLabel: "Confier l'animation",
    destructive: false,
  },
};
