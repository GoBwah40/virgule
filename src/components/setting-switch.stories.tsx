import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { SettingSwitch } from "./setting-switch";

const meta = {
  title: "Composants/SettingSwitch",
  component: SettingSwitch,
  args: {
    id: "self-vote",
    label: "Voter sur ses propres idées",
    hint: "Si c'est désactivé, personne ne peut voter pour ou contre les idées qu'il a proposées.",
    checked: true,
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof SettingSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactif: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return <SettingSwitch {...args} checked={checked} onCheckedChange={setChecked} />;
  },
};
export const Desactive: Story = { args: { disabled: true } };
