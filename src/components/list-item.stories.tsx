import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListItem } from "./list-item";
import { StatusBadge } from "./status-badge";
import { Badge } from "./ui/badge";

const meta = {
  title: "Composants/ListItem",
  component: ListItem,
  decorators: [(Story) => <ul className="max-w-md space-y-2"><Story /></ul>],
  args: { children: "Salle des fêtes du quartier" },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutre: Story = {};
export const Carte: Story = { args: { tone: "plain" } };

export const AvecMeta: Story = {
  args: { meta: <Badge className="bg-highlight-soft text-highlight-foreground">Ton idée</Badge> },
};

export const Retenue: Story = {
  args: {
    tone: "positive",
    actions: <StatusBadge status="retained" label="Retenue" tooltip="Score +3 · 4 pour, 1 contre" />,
  },
};

export const Ecartee: Story = {
  args: {
    tone: "negative",
    children: "Soirée karaoké",
    actions: <StatusBadge status="rejected" label="Écartée" tooltip="Score −3 · 1 pour, 4 contre" />,
  },
};

export const TexteLong: Story = {
  args: {
    children:
      "Organiser une chasse au trésor dans le parc avec des énigmes sur les souvenirs de Léa, puis finir par un pique-nique et un blind test",
  },
};
