import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "./logo";

const meta = {
  title: "Composants/Logo",
  component: Logo,
  args: { label: "Virgule", className: "text-6xl" },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logotype: Story = {};
export const EnTete: Story = { args: { className: "text-2xl" } };
export const Symbole: Story = { args: { variant: "mark" } };
