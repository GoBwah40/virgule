import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListItem } from "./list-item";
import { ScrollableList } from "./scrollable-list";

const IDEAS = [
  "Picnic by the lake",
  "Escape game downtown",
  "Cooking class",
  "Bike ride along the canal",
  "Board game evening",
  "Karaoke night",
  "Visit the street art museum",
  "Climbing gym",
  "Open-air cinema",
  "Wine tasting",
];

const meta = {
  title: "Components/ScrollableList",
  component: ScrollableList,
  decorators: [(Story) => <div className="max-w-md rounded-xl bg-card p-4"><Story /></div>],
  args: {
    label: "Ideas",
    children: IDEAS.map((idea) => <ListItem key={idea}>{idea}</ListItem>),
  },
} satisfies Meta<typeof ScrollableList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overflowing: Story = {};
export const Short: Story = {
  args: { children: IDEAS.slice(0, 3).map((idea) => <ListItem key={idea}>{idea}</ListItem>) },
};
