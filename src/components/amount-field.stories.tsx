import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { AmountField } from "./amount-field";

const meta = {
  title: "Composants/AmountField",
  component: AmountField,
  decorators: [(Story) => <div className="max-w-sm"><Story /></div>],
  args: {
    mode: "range",
    idPrefix: "story",
    value: { min: "300", max: "500" },
    onChange: fn(),
    labels: { amount: "Montant", min: "Entre", max: "Et", currency: "€" },
  },
} satisfies Meta<typeof AmountField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fourchette: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <AmountField {...args} value={value} onChange={setValue} />;
  },
};
export const MontantUnique: Story = { args: { mode: "single", value: { min: "250", max: "" } } };
