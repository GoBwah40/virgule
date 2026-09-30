import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ShareButton } from "./share-button";

// Visible uniquement dans un navigateur qui propose le partage natif (téléphone, Safari…).
const meta = {
  title: "Composants/ShareButton",
  component: ShareButton,
  args: { path: "/r/ab23cd45ef", title: "Week-end de juin", text: "Rejoins la séance", label: "Partager" },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Partager: Story = {};
