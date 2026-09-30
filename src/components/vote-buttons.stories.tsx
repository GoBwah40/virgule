import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { VoteButtons } from "./vote-buttons";

const meta = {
  title: "Components/VoteButtons",
  component: VoteButtons,
  args: { value: null, onChange: fn(), labels: { up: "For", down: "Against" } },
} satisfies Meta<typeof VoteButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive: one tap votes, a second tap on the same button removes the vote. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<boolean | null>(null);
    return (
      <VoteButtons
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
};

export const For: Story = { args: { value: true } };
export const Against: Story = { args: { value: false } };
export const Disabled: Story = { args: { disabledReason: "Voting on your own ideas is turned off." } };
