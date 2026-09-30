import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { LocaleToggle } from "./locale-toggle";

const meta = {
  title: "Components/LocaleToggle",
  component: LocaleToggle,
  args: {
    value: "en",
    onChange: fn(),
    labels: { group: "Language" },
    options: [
      { value: "en", short: "EN", name: "English" },
      { value: "fr", short: "FR", name: "Français" },
    ],
  },
} satisfies Meta<typeof LocaleToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
export const French: Story = { args: { value: "fr" } };
