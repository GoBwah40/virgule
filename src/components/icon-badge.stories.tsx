import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarRange, Coins } from "lucide-react";

import { IconBadge } from "./icon-badge";

const meta = {
  title: "Composants/IconBadge",
  component: IconBadge,
  args: { icon: CalendarRange, label: "Période" },
} satisfies Meta<typeof IconBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Periode: Story = {};
export const Fourchette: Story = { args: { icon: Coins, label: "Fourchette" } };
