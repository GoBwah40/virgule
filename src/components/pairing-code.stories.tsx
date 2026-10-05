import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PairingCode } from "./pairing-code";

const meta = {
  title: "Components/PairingCode",
  component: PairingCode,
  args: { code: "K7QM3X", label: "Pairing code" },
} satisfies Meta<typeof PairingCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { className: "text-2xl" } };
