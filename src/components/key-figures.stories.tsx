import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KeyFigures } from "./key-figures";

const meta = {
  title: "Composants/KeyFigures",
  component: KeyFigures,
  args: {
    items: [
      { value: 6, label: "places" },
      { value: 1, label: "lien à partager" },
      { value: 7, label: "jours en ligne" },
      { value: 0, label: "compte à créer" },
    ],
  },
} satisfies Meta<typeof KeyFigures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Accueil: Story = {};
