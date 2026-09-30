import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CardSkeleton } from "./card-skeleton";

const meta = {
  title: "Loading/CardSkeleton",
  component: CardSkeleton,
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
} satisfies Meta<typeof CardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ideas: Story = { args: { rows: 2, rowActions: "votes", withComposer: true } };
export const Recap: Story = { args: { rows: 3, rowActions: "status" } };
export const Empty: Story = { args: { rows: 0 } };
