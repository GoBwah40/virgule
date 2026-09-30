import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OverviewSummary } from "./overview-summary";

const meta = {
  title: "Components/OverviewSummary",
  component: OverviewSummary,
  args: { summary: "Common slot: June 12 – 14, 2027", detail: "Shared by all 3 periods kept.", common: true },
} satisfies Meta<typeof OverviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Common: Story = {};
export const Partial: Story = {
  args: { summary: "Most shared slot: June 13 – 14, 2027", detail: "Shared by 2 of the 3 periods kept.", common: false },
};
