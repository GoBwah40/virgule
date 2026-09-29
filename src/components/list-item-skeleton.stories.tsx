import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ListItemSkeleton } from "./list-item-skeleton";

const meta = {
  title: "Chargement/ListItemSkeleton",
  component: ListItemSkeleton,
  decorators: [(Story) => <ul className="max-w-md space-y-2"><Story /></ul>],
} satisfies Meta<typeof ListItemSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};
export const AvecVotes: Story = { args: { actions: "votes", withMeta: true } };
export const AvecStatut: Story = { args: { actions: "status", width: "long" } };
