import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CountBadge } from "./count-badge";

const meta = {
  title: "Components/CountBadge",
  component: CountBadge,
  args: { label: "14 ideas" },
} satisfies Meta<typeof CountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Progress: Story = { args: { label: "3/14 voted", tone: "progress" } };
export const Complete: Story = { args: { label: "14/14 voted", tone: "complete" } };
