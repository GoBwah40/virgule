import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { SettingSwitch } from "./setting-switch";

const meta = {
  title: "Components/SettingSwitch",
  component: SettingSwitch,
  args: {
    id: "self-vote",
    label: "Vote on your own ideas",
    hint: "When off, nobody can vote for or against the ideas they suggested.",
    checked: true,
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof SettingSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return <SettingSwitch {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};
export const Disabled: Story = { args: { disabled: true } };
