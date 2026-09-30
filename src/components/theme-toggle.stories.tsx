import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Composants/ThemeToggle",
  component: ThemeToggle,
  args: {
    value: "system",
    onChange: fn(),
    labels: { group: "Thème", system: "Comme l'appareil", light: "Clair", dark: "Sombre" },
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Systeme: Story = {};
export const Clair: Story = { args: { value: "light" } };
export const Sombre: Story = { args: { value: "dark" } };
