import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormField } from "./form-field";
import { Input } from "./ui/input";

const meta = {
  title: "Composants/FormField",
  component: FormField,
  args: {
    id: "session-name",
    label: "Nom de la séance",
    children: <Input id="session-name" placeholder="Ex. : Anniversaire de Léa" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AvecAide: Story = { args: { hint: "Visible par tous les participants." } };
