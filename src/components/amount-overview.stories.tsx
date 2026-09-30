import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AmountOverview } from "./amount-overview";

const meta = {
  title: "Components/AmountOverview",
  component: AmountOverview,
  args: {
    ranges: [
      { min: 200, max: 400 },
      { min: 300, max: 500 },
      { min: 250, max: 450 },
    ],
    best: { start: 300, end: 400 },
    locale: "en",
    labels: { range: "A range kept", zone: "Compatible zone", amounts: "Ranges kept on the same scale" },
  },
} satisfies Meta<typeof AmountOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Common: Story = {};
export const Partial: Story = {
  args: {
    ranges: [
      { min: 100, max: 200 },
      { min: 300, max: 500 },
      { min: 350, max: 600 },
    ],
    best: { start: 350, end: 500 },
  },
};
