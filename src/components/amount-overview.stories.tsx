import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AmountOverview } from "./amount-overview";

const meta = {
  title: "Composants/AmountOverview",
  component: AmountOverview,
  args: {
    ranges: [
      { min: 200, max: 400 },
      { min: 300, max: 500 },
      { min: 250, max: 450 },
    ],
    best: { start: 300, end: 400 },
    locale: "fr",
    labels: { range: "Une fourchette retenue", zone: "Zone compatible", amounts: "Fourchettes retenues sur une même échelle" },
  },
} satisfies Meta<typeof AmountOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Commun: Story = {};
export const Partiel: Story = {
  args: {
    ranges: [
      { min: 100, max: 200 },
      { min: 300, max: 500 },
      { min: 350, max: 600 },
    ],
    best: { start: 350, end: 500 },
  },
};
