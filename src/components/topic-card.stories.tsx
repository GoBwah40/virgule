import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarRange, Pencil, Trash2, Vote } from "lucide-react";

import { Button } from "./ui/button";
import { TopicCard } from "./topic-card";

const meta = {
  title: "Components/TopicCard",
  component: TopicCard,
  decorators: [
    (Story) => (
      <ul className="max-w-xs">
        <Story />
      </ul>
    ),
  ],
  args: { title: "When do we leave?", description: "Two days, in May or June", badges: [{ label: "Period", icon: CalendarRange }] },
} satisfies Meta<typeof TopicCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FreeText: Story = { args: { title: "What do we cook?", description: undefined, badges: [] } };
export const VoteLimit: Story = {
  args: { badges: [{ label: "Period", icon: CalendarRange }, { label: "2 “for” votes each", icon: Vote }] },
};
export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="ghost" size="icon" aria-label="Edit">
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Delete">
          <Trash2 />
        </Button>
      </>
    ),
  },
};
