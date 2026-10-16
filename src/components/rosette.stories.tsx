import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Rosette } from "./rosette";

const meta = {
  title: "Components/Rosette",
  component: Rosette,
  args: { className: "size-56" },
} satisfies Meta<typeof Rosette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixSeats: Story = {};
export const Small: Story = { args: { className: "size-24" } };
/** Loading screen: turns a third of a turn at a time, on the dark veil. */
export const Loading: Story = {
  args: { className: "size-24 motion-safe:animate-rosette-turn" },
  render: (args) => (
    <div className="grid h-64 place-items-center rounded-xl bg-scrim">
      <Rosette {...args} />
    </div>
  ),
};
