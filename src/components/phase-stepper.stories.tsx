import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PhaseStepper } from "./phase-stepper";
import { Badge } from "./ui/badge";

const meta = {
  title: "Components/PhaseStepper",
  component: PhaseStepper,
  args: {
    label: "Session steps",
    steps: [
      { id: "THEMES", label: "Topics" },
      { id: "IDEAS", label: "Ideas" },
      { id: "RECAP", label: "Recap" },
    ],
    current: 1,
  },
} satisfies Meta<typeof PhaseStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ideas: Story = {};
export const WithRound: Story = {
  args: {
    current: 2,
    extra: (
      <li>
        <Badge variant="outline">Round 2</Badge>
      </li>
    ),
  },
};
export const Done: Story = { args: { current: 3 } };
