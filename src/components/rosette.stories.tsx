import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Rosette } from "./rosette";

const meta = {
  title: "Composants/Rosette",
  component: Rosette,
  args: { className: "size-56" },
} satisfies Meta<typeof Rosette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixPlaces: Story = {};
export const Petite: Story = { args: { className: "size-24" } };
