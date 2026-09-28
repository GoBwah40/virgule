import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CopyButton } from "./copy-button";

const meta = {
  title: "Composants/CopyButton",
  component: CopyButton,
  args: {
    value: "/r/phanknt6vc",
    absolute: true,
    label: "Copier le lien d'invitation",
    successMessage: "Lien copié, tu peux le partager au groupe",
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const IconeSurMobile: Story = { args: { hideLabelOnMobile: true, size: "icon" } };
