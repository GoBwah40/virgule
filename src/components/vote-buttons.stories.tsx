import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { VoteButtons } from "./vote-buttons";

const meta = {
  title: "Composants/VoteButtons",
  component: VoteButtons,
  args: { value: null, onChange: fn(), labels: { up: "Pour", down: "Contre" } },
} satisfies Meta<typeof VoteButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactif : un tap vote, un second tap sur le même bouton retire le vote. */
export const Interactif: Story = {
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

export const Pour: Story = { args: { value: true } };
export const Contre: Story = { args: { value: false } };
export const Desactive: Story = { args: { disabledReason: "Le vote sur tes propres idées est désactivé." } };
