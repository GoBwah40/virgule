import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "./status-badge";

const meta = {
  title: "Composants/StatusBadge",
  component: StatusBadge,
  args: { status: "retained", label: "Retenue" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Retenue: Story = {};
export const Ecartee: Story = { args: { status: "rejected", label: "Écartée" } };
