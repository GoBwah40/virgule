import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "./page-header";
import { Button } from "./ui/button";

const meta = {
  title: "Composants/PageHeader",
  component: PageHeader,
  args: { title: "Les idées", subtitle: "Propose tes idées et vote pour celles des autres." },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AvecActions: Story = {
  args: {
    actions: (
      <>
        <Button>Voir le bilan</Button>
        <Button variant="outline">Modifier les sujets</Button>
      </>
    ),
  },
};
