import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "./page-header";
import { PhaseTransition } from "./phase-transition";

// Storybook uses stable React: the transition doesn't play there (it only exists in the
// React bundled with Next). The story documents usage and checks the content renders.
const meta = {
  title: "Components/PhaseTransition",
  component: PhaseTransition,
  args: {
    children: <PageHeader title="The ideas" subtitle="Suggest your ideas and vote on everyone else's." />,
  },
} satisfies Meta<typeof PhaseTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
