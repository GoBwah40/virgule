import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeaderSkeleton } from "./page-header-skeleton";

const meta = {
  title: "Chargement/PageHeaderSkeleton",
  component: PageHeaderSkeleton,
} satisfies Meta<typeof PageHeaderSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AvecActions: Story = { args: { actions: 2 } };
