import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressMeter } from "./progress-meter";

const meta = {
  title: "Composants/ProgressMeter",
  component: ProgressMeter,
  args: {
    value: 3,
    max: 5,
    label: "3 personnes sur 5 ont voté",
    completeLabel: "Tout le monde a voté",
    ariaLabel: "Participants ayant voté",
  },
} satisfies Meta<typeof ProgressMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnCours: Story = {};
export const Personne: Story = { args: { value: 0, label: "Personne n'a encore voté" } };
export const Complet: Story = { args: { value: 5 } };
