import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { OptionListField } from "./option-list-field";

const meta = {
  title: "Components/OptionListField",
  component: OptionListField,
  args: {
    idPrefix: "story",
    value: ["Seaside", "Mountains", "City"],
    onChange: fn(),
    max: 10,
    maxLength: 60,
    labels: {
      label: "Options",
      hint: "Between 2 and 10 options. They become ideas to vote on when the ideas start.",
      placeholder: "E.g. Seaside",
      add: "Add the option",
      remove: (option: string) => `Remove the option “${option}”`,
    },
  },
} satisfies Meta<typeof OptionListField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};
export const Empty: Story = { args: { value: [] } };
export const Full: Story = { args: { max: 3 } };
