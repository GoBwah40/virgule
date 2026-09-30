import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { SuggestionChips } from "./suggestion-chips";

const meta = {
  title: "Components/SuggestionChips",
  component: SuggestionChips,
  args: {
    label: "Topic ideas",
    onSelect: fn(),
    items: ["Goal", "Dates", "Place", "Budget", "Priorities", "Who does what"].map((label) => ({ id: label, label })),
  },
} satisfies Meta<typeof SuggestionChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
