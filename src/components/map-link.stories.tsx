import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MapLink } from "./map-link";

const meta = {
  title: "Composants/MapLink",
  component: MapLink,
  args: { query: "Gîte des Trois Chênes, Vercors", label: "Voir sur la carte" },
} satisfies Meta<typeof MapLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lieu: Story = {};
