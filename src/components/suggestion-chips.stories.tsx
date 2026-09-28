import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { SuggestionChips } from "./suggestion-chips";

const meta = {
  title: "Composants/SuggestionChips",
  component: SuggestionChips,
  args: {
    label: "Idées de sujets",
    onSelect: fn(),
    items: ["Objectif", "Dates", "Lieu", "Budget", "Priorités", "Qui fait quoi"].map((label) => ({ id: label, label })),
  },
} satisfies Meta<typeof SuggestionChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Desactive: Story = { args: { disabled: true } };
