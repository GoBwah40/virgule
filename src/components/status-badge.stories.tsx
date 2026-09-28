import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "./status-badge";

const meta = {
  title: "Composants/StatusBadge",
  component: StatusBadge,
  args: { status: "retained", label: "Retenue", tooltip: "Score +3 · 4 pour, 1 contre" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Retenue: Story = {};
export const Ecartee: Story = { args: { status: "rejected", label: "Écartée", tooltip: "Score −3 · 1 pour, 4 contre" } };
export const SansInfobulle: Story = { args: { tooltip: undefined } };
