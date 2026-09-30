import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "./status-badge";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  args: { status: "retained", label: "Kept" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kept: Story = {};
export const Dropped: Story = { args: { status: "rejected", label: "Dropped" } };
