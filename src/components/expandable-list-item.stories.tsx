import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ExpandableListItem } from "./expandable-list-item";
import { StatusBadge } from "./status-badge";
import { VoteSummary } from "./vote-summary";

const meta = {
  title: "Composants/ExpandableListItem",
  component: ExpandableListItem,
  decorators: [(Story) => <ul className="max-w-md space-y-2"><Story /></ul>],
  args: {
    children: "Salle des fêtes du quartier",
    tone: "positive",
    aside: <StatusBadge status="retained" label="Retenue" />,
    details: <VoteSummary up={4} down={1} labels={{ up: "4 pour", down: "1 contre" }} />,
  },
} satisfies Meta<typeof ExpandableListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Repliee: Story = {};
export const Depliee: Story = { args: { defaultOpen: true } };
export const Ecartee: Story = {
  args: {
    children: "Restaurant italien",
    tone: "negative",
    aside: <StatusBadge status="rejected" label="Écartée" />,
    details: <VoteSummary up={1} down={4} labels={{ up: "1 pour", down: "4 contre" }} />,
    defaultOpen: true,
  },
};
