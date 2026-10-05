import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Countdown } from "./countdown";

const inSeconds = (s: number) => new Date(Date.now() + s * 1000).toISOString();

const meta = {
  title: "Components/Countdown",
  component: Countdown,
  args: {
    endsAt: inSeconds(4 * 60 + 5),
    labels: { running: "Time left for ideas", expired: "Time's up" },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};
export const LastMinute: Story = { args: { endsAt: inSeconds(42) } };
export const Expired: Story = { args: { endsAt: inSeconds(-5) } };
export const Large: Story = {
  args: { size: "lg" },
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
};
