import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { VoteSummary } from "./vote-summary";

const meta = {
  title: "Composants/VoteSummary",
  component: VoteSummary,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
  args: { up: 4, down: 1, labels: { up: "4 pour", down: "1 contre" } },
} satisfies Meta<typeof VoteSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MajoritePour: Story = {};
export const Egalite: Story = { args: { up: 2, down: 2, labels: { up: "2 pour", down: "2 contre" } } };
export const AucunVote: Story = { args: { up: 0, down: 0, labels: { up: "0 pour", down: "0 contre" } } };
