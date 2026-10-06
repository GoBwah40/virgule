import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { PointsStepper } from "./points-stepper";

const labels = (value: number) => ({
  decrease: "One point less",
  increase: "One point more",
  value: `${value} ${value === 1 ? "point" : "points"}`,
  group: "Your points for this idea",
});

const meta = {
  title: "Components/PointsStepper",
  component: PointsStepper,
  args: { value: 0, max: 5, onChange: fn(), labels: labels(0) },
} satisfies Meta<typeof PointsStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive: 5 points to give, all on this idea if you like. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState(0);
    return (
      <PointsStepper
        {...args}
        value={value}
        labels={labels(value)}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export const NoPoints: Story = {};
export const SomePoints: Story = { args: { value: 2, labels: labels(2) } };
export const NoPointsLeft: Story = {
  args: { value: 1, max: 1, labels: labels(1), increaseDisabledReason: "You've given all your points in this topic." },
};
export const Disabled: Story = { args: { disabledReason: "Voting on your own ideas is turned off." } };
