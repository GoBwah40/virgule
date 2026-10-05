import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationIdeas } from "./presentation-ideas";

const meta = {
  title: "Components/PresentationIdeas",
  component: PresentationIdeas,
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
    emptyLabel: "Waiting for the first idea",
    topics: [
      {
        id: "1",
        title: "When do we leave?",
        countLabel: "2 ideas",
        ideas: [
          { id: "a", content: "May 14 – 15, 2027" },
          { id: "b", content: "June 4 – 5, 2027" },
        ],
      },
      {
        id: "2",
        title: "Where to?",
        countLabel: "3 ideas",
        ideas: [
          { id: "c", content: "Annecy" },
          { id: "d", content: "A cottage in the Beaujolais" },
          { id: "e", content: "Chamonix" },
        ],
      },
      { id: "3", title: "How much each?", countLabel: "No ideas yet", ideas: [] },
    ],
  },
} satisfies Meta<typeof PresentationIdeas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongIdea: Story = {
  args: {
    topics: [{ id: "1", title: "Links", countLabel: "1 idea", ideas: [{ id: "a", content: `https://example.com/${"a".repeat(200)}` }] }],
  },
};
