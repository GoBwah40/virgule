import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SourceLink } from "./source-link";

const meta = {
  title: "Components/SourceLink",
  component: SourceLink,
  args: { href: "https://github.com/GoBwah40/virgule", label: "Source code" },
} satisfies Meta<typeof SourceLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GitHub: Story = {};
