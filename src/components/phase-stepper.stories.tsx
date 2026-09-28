import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PhaseStepper } from "./phase-stepper";
import { Badge } from "./ui/badge";

const meta = {
  title: "Composants/PhaseStepper",
  component: PhaseStepper,
  args: {
    label: "Étapes de la séance",
    steps: [
      { id: "THEMES", label: "Sujets" },
      { id: "IDEAS", label: "Idées" },
      { id: "RECAP", label: "Bilan" },
    ],
    current: 1,
  },
} satisfies Meta<typeof PhaseStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idees: Story = {};
export const AvecTour: Story = {
  args: {
    current: 2,
    extra: (
      <li>
        <Badge variant="outline">Tour 2</Badge>
      </li>
    ),
  },
};
export const Termine: Story = { args: { current: 3 } };
