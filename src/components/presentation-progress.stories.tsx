import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationProgress } from "./presentation-progress";

const meta = {
  title: "Components/PresentationProgress",
  component: PresentationProgress,
  // The room screen is always dark.
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  args: {
    value: 4,
    max: 6,
    label: "4 people out of 6 have voted",
    completeLabel: "Everyone has voted",
    ariaLabel: "Participants who voted",
  },
} satisfies Meta<typeof PresentationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};
export const Nobody: Story = { args: { value: 0, label: "Nobody has voted yet" } };
export const Complete: Story = { args: { value: 6 } };
