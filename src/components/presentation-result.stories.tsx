import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationResult } from "./presentation-result";

const idea = (id: string, content: string, up: number, down: number, qualified: boolean) => ({
  id,
  content,
  up,
  down,
  qualified,
  votesLabel: `${up} for, ${down} against`,
  statusLabel: qualified ? "Kept" : "Dropped",
});

const meta = {
  title: "Components/PresentationResult",
  component: PresentationResult,
  parameters: { viewport: { defaultViewport: "responsive" } },
  // The room screen is always dark.
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  args: {
    topic: "Where to?",
    winners: ["Annecy"],
    verdict: "Kept by the group",
    ideas: [
      idea("1", "Annecy", 5, 1, true),
      idea("2", "A cottage in the Beaujolais", 4, 2, true),
      idea("3", "Chamonix", 2, 3, false),
    ],
  },
} satisfies Meta<typeof PresentationResult>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kept: Story = {};
export const Tied: Story = {
  args: {
    winners: ["Annecy", "Chamonix"],
    verdict: "Tied for first",
    ideas: [idea("1", "Annecy", 3, 0, true), idea("3", "Chamonix", 3, 0, true)],
  },
};
export const NoneKept: Story = {
  args: { winners: [], verdict: "No idea kept on this topic", ideas: [idea("3", "Chamonix", 1, 3, false)] },
};
export const Many: Story = { args: { moreLabel: "+ 4 more ideas" } };
export const NoIdeas: Story = { args: { winners: [], verdict: "No idea kept on this topic", ideas: [] } };
export const InRecapPage: Story = {
  args: { variant: "page" },
  decorators: [(Story) => <div className="bg-background p-6"><Story /></div>],
};
