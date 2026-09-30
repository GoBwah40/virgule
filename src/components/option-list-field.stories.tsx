import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { OptionListField } from "./option-list-field";

const meta = {
  title: "Composants/OptionListField",
  component: OptionListField,
  args: {
    idPrefix: "story",
    value: ["Mer", "Montagne", "Ville"],
    onChange: fn(),
    max: 10,
    maxLength: 60,
    labels: {
      label: "Options",
      hint: "Entre 2 et 10 options. Elles deviennent des idées à voter au lancement.",
      placeholder: "Ex. : Mer",
      add: "Ajouter l'option",
      remove: (option: string) => `Retirer l'option « ${option} »`,
    },
  },
} satisfies Meta<typeof OptionListField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rempli: Story = {};
export const Vide: Story = { args: { value: [] } };
export const Complet: Story = { args: { max: 3 } };
