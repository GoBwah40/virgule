import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "./page-header";
import { PhaseTransition } from "./phase-transition";

// Storybook utilise React stable : la transition ne s'y joue pas (elle n'existe que dans
// le React embarqué par Next). La story documente l'usage et vérifie le rendu du contenu.
const meta = {
  title: "Composants/PhaseTransition",
  component: PhaseTransition,
  args: {
    children: <PageHeader title="Les idées" subtitle="Propose tes idées et vote pour celles des autres." />,
  },
} satisfies Meta<typeof PhaseTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
