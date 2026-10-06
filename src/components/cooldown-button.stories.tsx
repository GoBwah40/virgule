import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BellRing } from "lucide-react";

import { CooldownButton } from "./cooldown-button";

const meta = {
  title: "Components/CooldownButton",
  component: CooldownButton,
  args: { label: "Remind the group to vote", doneLabel: "Reminder sent", availableAt: null, icon: BellRing },
} satisfies Meta<typeof CooldownButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Waiting: Story = { args: { availableAt: new Date(Date.now() + 60_000).toISOString() } };
export const Pending: Story = { args: { pending: true } };
