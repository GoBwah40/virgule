import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "./logo";

const meta = {
  title: "Components/Logo",
  component: Logo,
  args: { label: "Virgule", className: "text-6xl" },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {};
export const Header: Story = { args: { className: "text-2xl" } };
export const Mark: Story = { args: { variant: "mark" } };
/** Session header: back home, in a 44 × 44 px touch area. */
export const HomeLink: Story = { args: { href: "/", className: "text-lg" } };
