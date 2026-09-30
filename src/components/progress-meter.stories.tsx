import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressMeter } from "./progress-meter";

const meta = {
  title: "Components/ProgressMeter",
  component: ProgressMeter,
  args: {
    value: 3,
    max: 5,
    label: "3 people out of 5 have voted",
    completeLabel: "Everyone has voted",
    ariaLabel: "Participants who voted",
  },
} satisfies Meta<typeof ProgressMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};
export const Nobody: Story = { args: { value: 0, label: "Nobody has voted yet" } };
export const Complete: Story = { args: { value: 5 } };
export const Bar: Story = {
  args: { value: 7, max: 18, label: "11 ideas left without your vote", ariaLabel: "Ideas you voted on" },
};
