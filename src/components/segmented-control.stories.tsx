import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, CalendarRange, Coins, Euro, Type } from "lucide-react";
import { useState } from "react";
import { fn } from "storybook/test";

import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "TEXT", label: "Text", icon: Type },
  { value: "DATE", label: "Date", icon: CalendarDays },
  { value: "DATE_RANGE", label: "Period", icon: CalendarRange },
  { value: "AMOUNT", label: "Amount", icon: Euro },
  { value: "AMOUNT_RANGE", label: "Range", icon: Coins },
];

const meta = {
  title: "Components/SegmentedControl",
  component: SegmentedControl,
  args: {
    name: "kind",
    label: "Answer type",
    options,
    value: "DATE_RANGE",
    onChange: fn(),
    hint: "Everyone suggests a period: from… to…",
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};
export const Locked: Story = {
  args: { disabled: true, hint: "Ideas have already been suggested: the answer type can no longer change." },
};
