import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { RenameDialog } from "./rename-dialog";

const meta = {
  title: "Components/RenameDialog",
  component: RenameDialog,
  args: {
    value: "Friday night",
    maxLength: 80,
    labels: {
      trigger: "Rename the session",
      title: "Rename the session",
      description: "Everyone in the session sees the new name.",
      field: "Session name",
      submit: "Rename",
      close: "Close",
    },
    onSubmit: fn(),
  },
} satisfies Meta<typeof RenameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = { args: { pending: true } };
export const WithoutDescription: Story = {
  args: { labels: { trigger: "Rename", title: "Rename", field: "Name", submit: "Rename", close: "Close" } },
};
