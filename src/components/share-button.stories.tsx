import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ShareButton } from "./share-button";

// Only visible in a browser that offers native sharing (phone, Safari…).
const meta = {
  title: "Components/ShareButton",
  component: ShareButton,
  args: { path: "/r/ab23cd45ef", title: "June weekend", text: "Join the session", label: "Share" },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Share: Story = {};
