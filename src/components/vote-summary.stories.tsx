import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VoteSummary } from "./vote-summary";

const meta = {
  title: "Components/VoteSummary",
  component: VoteSummary,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
  args: { up: 4, down: 1, labels: { up: "4 for", down: "1 against" } },
} satisfies Meta<typeof VoteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MostlyFor: Story = {};
export const Tie: Story = { args: { up: 2, down: 2, labels: { up: "2 for", down: "2 against" } } };
export const NoVotes: Story = { args: { up: 0, down: 0, labels: { up: "0 for", down: "0 against" } } };
