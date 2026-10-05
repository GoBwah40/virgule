import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationJoin } from "./presentation-join";

const meta = {
  title: "Components/PresentationJoin",
  component: PresentationJoin,
  // The room screen is always dark.
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  args: { path: "/r/abc123", label: "Scan to join", qrLabel: "QR code for the invite link" },
} satisfies Meta<typeof PresentationJoin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {};
export const Corner: Story = { args: { size: "sm" } };
