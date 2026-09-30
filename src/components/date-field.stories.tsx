import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { DateField } from "./date-field";

const meta = {
  title: "Components/DateField",
  component: DateField,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
  args: {
    mode: "range",
    idPrefix: "story",
    value: { start: "2027-06-12", end: "2027-06-14" },
    onChange: fn(),
    labels: { date: "Date", from: "From", to: "To" },
  },
} satisfies Meta<typeof DateField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Period: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <DateField {...args} value={value} onChange={setValue} />;
  },
};
export const SingleDate: Story = { args: { mode: "single", value: { start: "2027-06-12", end: "2027-06-12" } } };
