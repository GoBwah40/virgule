import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarRange, Coins } from "lucide-react";

import { IconBadge } from "./icon-badge";

const meta = {
  title: "Components/IconBadge",
  component: IconBadge,
  args: { icon: CalendarRange, label: "Period" },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Period: Story = {};
export const Range: Story = { args: { icon: Coins, label: "Range" } };
