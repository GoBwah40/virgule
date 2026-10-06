import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReadOnlyHeader } from "./read-only-header";

const meta = {
  title: "Components/ReadOnlyHeader",
  component: ReadOnlyHeader,
  args: {
    logoLabel: "Virgule",
    title: "Friday night",
    subtitle: "Shared by Sam · Online until October 13, 2026",
    note: "Read-only: the recap as the group decided it",
  },
} satisfies Meta<typeof ReadOnlyHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongTitle: Story = { args: { title: "Product offsite in the mountains with the whole team, autumn 2026" } };
