import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListItem } from "./list-item";
import { StatusBadge } from "./status-badge";
import { Badge } from "./ui/badge";

const meta = {
  title: "Components/ListItem",
  component: ListItem,
  decorators: [(Story) => <ul className="max-w-md space-y-2"><Story /></ul>],
  args: { children: "Neighbourhood community hall" },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Plain: Story = { args: { tone: "plain" } };

export const WithMeta: Story = {
  args: { meta: <Badge className="bg-highlight-soft text-highlight-foreground">Your idea</Badge> },
};

export const Kept: Story = {
  args: {
    tone: "positive",
    actions: <StatusBadge status="retained" label="Kept" />,
  },
};

export const Dropped: Story = {
  args: {
    tone: "negative",
    children: "Karaoke night",
    actions: <StatusBadge status="rejected" label="Dropped" />,
  },
};

export const WithContentBelow: Story = {
  args: {
    meta: <Badge variant="outline">2 comments</Badge>,
    below: <p className="text-sm text-muted-foreground">Comments revealed on demand go here, full width.</p>,
  },
};

export const LongText: Story = {
  args: {
    children:
      "Set up a treasure hunt in the park with riddles about Lea's memories, then finish with a picnic and a music quiz",
  },
};
