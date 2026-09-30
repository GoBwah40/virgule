import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ExpandableListItem } from "./expandable-list-item";
import { StatusBadge } from "./status-badge";
import { VoteSummary } from "./vote-summary";

const meta = {
  title: "Components/ExpandableListItem",
  component: ExpandableListItem,
  decorators: [(Story) => <ul className="max-w-md space-y-2"><Story /></ul>],
  args: {
    children: "Neighbourhood community hall",
    tone: "positive",
    aside: <StatusBadge status="retained" label="Kept" />,
    details: <VoteSummary up={4} down={1} labels={{ up: "4 for", down: "1 against" }} />,
  },
} satisfies Meta<typeof ExpandableListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};
export const Expanded: Story = { args: { defaultOpen: true } };
export const Dropped: Story = {
  args: {
    children: "Italian restaurant",
    tone: "negative",
    aside: <StatusBadge status="rejected" label="Dropped" />,
    details: <VoteSummary up={1} down={4} labels={{ up: "1 for", down: "4 against" }} />,
    defaultOpen: true,
  },
};
