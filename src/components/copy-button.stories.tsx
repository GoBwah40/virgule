import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CopyButton } from "./copy-button";

const meta = {
  title: "Components/CopyButton",
  component: CopyButton,
  args: {
    value: "/r/phanknt6vc",
    absolute: true,
    label: "Copy the invite link",
    successMessage: "Link copied, you can share it with the group",
    errorMessage: "Couldn't copy the link: copy it from the address bar.",
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const IconOnMobile: Story = { args: { hideLabelOnMobile: true, size: "icon" } };
