import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  args: {
    value: "system",
    onChange: fn(),
    labels: { group: "Theme", system: "Same as device", light: "Light", dark: "Dark" },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const System: Story = {};
export const Light: Story = { args: { value: "light" } };
export const Dark: Story = { args: { value: "dark" } };
