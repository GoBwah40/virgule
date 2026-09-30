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
