import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationTopics } from "./presentation-topics";

const meta = {
  title: "Components/PresentationTopics",
  component: PresentationTopics,
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
    title: "What we need to decide",
    topics: [
      { id: "1", title: "When do we leave?", description: "Two days, in May or June", kindLabel: "Period" },
      { id: "2", title: "Where to?", description: "Less than two hours from Lyon", kindLabel: "Place" },
      { id: "3", title: "How much each?", description: "Lodging and meals included", kindLabel: "Range" },
    ],
  },
} satisfies Meta<typeof PresentationTopics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FreeText: Story = { args: { topics: [{ id: "1", title: "What do we cook?" }] } };
