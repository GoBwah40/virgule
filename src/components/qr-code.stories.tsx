import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { QrCode } from "./qr-code";

const meta = {
  title: "Composants/QrCode",
  component: QrCode,
  args: { value: "https://virgule.vercel.app/r/ab23cd45ef", label: "QR code du lien d'invitation", className: "w-56" },
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Invitation: Story = {};
