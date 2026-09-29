import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CardSkeleton } from "./card-skeleton";

const meta = {
  title: "Chargement/CardSkeleton",
  component: CardSkeleton,
  decorators: [(Story) => <div className="max-w-md"><Story /></div>],
} satisfies Meta<typeof CardSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idees: Story = { args: { rows: 2, rowActions: "votes", withComposer: true } };
export const Bilan: Story = { args: { rows: 3, rowActions: "status" } };
export const Vide: Story = { args: { rows: 0 } };
