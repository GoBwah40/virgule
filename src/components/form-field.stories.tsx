import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormField } from "./form-field";
import { Input } from "./ui/input";

const meta = {
  title: "Components/FormField",
  component: FormField,
  args: {
    id: "session-name",
    label: "Session name",
    children: <Input id="session-name" placeholder="E.g. Lea's birthday" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: "Visible to all participants." } };
