import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KeyFigures } from "./key-figures";

const meta = {
  title: "Components/KeyFigures",
  component: KeyFigures,
  args: {
    items: [
      { value: 6, label: "seats" },
      { value: 1, label: "link to share" },
      { value: 7, label: "days online" },
      { value: 0, label: "accounts to create" },
    ],
  },
} satisfies Meta<typeof KeyFigures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {};
