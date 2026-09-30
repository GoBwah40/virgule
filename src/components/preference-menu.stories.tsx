import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Globe, Monitor, Moon, Sun } from "lucide-react";
import { fn } from "storybook/test";

import { PreferenceMenu } from "./preference-menu";

const meta = {
  title: "Components/PreferenceMenu",
  component: PreferenceMenu,
  args: {
    value: "fr",
    onChange: fn(),
    label: "Language",
    icon: Globe,
    showValue: true,
    options: [
      { value: "en", label: "English", lang: "en" },
      { value: "fr", label: "Français", lang: "fr" },
    ],
  },
  decorators: [(Story) => <div className="flex min-h-48 items-end justify-end p-4">{Story()}</div>],
} satisfies Meta<typeof PreferenceMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Language: Story = {};

/** Icon only: the current theme's icon, its name read by screen readers. */
export const Theme: Story = {
  args: {
    value: "dark",
    label: "Theme",
    icon: undefined,
    showValue: false,
    options: [
      { value: "system", label: "Same as device", icon: Monitor },
      { value: "light", label: "Light", icon: Sun },
      { value: "dark", label: "Dark", icon: Moon },
    ],
  },
};
