import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarDays, CalendarRange, Coins, Euro, Type } from "lucide-react";
import { useState } from "react";
import { fn } from "storybook/test";

import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "TEXT", label: "Texte", icon: Type },
  { value: "DATE", label: "Date", icon: CalendarDays },
  { value: "DATE_RANGE", label: "Période", icon: CalendarRange },
  { value: "AMOUNT", label: "Montant", icon: Euro },
  { value: "AMOUNT_RANGE", label: "Fourchette", icon: Coins },
];

const meta = {
  title: "Composants/SegmentedControl",
  component: SegmentedControl,
  args: {
    name: "kind",
    label: "Type de réponse",
    options,
    value: "DATE_RANGE",
    onChange: fn(),
    hint: "Chacun propose une période : du… au…",
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactif: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onChange={setValue} />;
  },
};
export const Verrouille: Story = {
  args: { disabled: true, hint: "Des idées ont déjà été proposées : le type de réponse ne peut plus changer." },
};
