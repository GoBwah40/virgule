import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toaster } from "@/components/ui/sonner";

import { VoteReminder } from "./vote-reminder";

// Renders nothing by itself: the toaster shows the reminder.
const meta = {
  title: "Components/VoteReminder",
  component: VoteReminder,
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  args: {
    sentAt: new Date().toISOString(),
    storageKey: "virgule:nudge:story",
    concerned: true,
    message: "Sam reminds the group: you still have ideas to vote on.",
  },
} satisfies Meta<typeof VoteReminder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Concerned: Story = {};
export const AllVoted: Story = { args: { concerned: false } };
