import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeaderSkeleton } from "./page-header-skeleton";

const meta = {
  title: "Loading/PageHeaderSkeleton",
  component: PageHeaderSkeleton,
} satisfies Meta<typeof PageHeaderSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActions: Story = { args: { actions: 2 } };
