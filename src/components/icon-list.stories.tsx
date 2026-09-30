import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListChecks, Lightbulb, Tags } from "lucide-react";

import { IconList } from "./icon-list";

const meta = {
  title: "Components/IconList",
  component: IconList,
  args: {
    items: [
      { icon: Tags, text: "You pick the topics to settle: goal, dates, budget…" },
      { icon: Lightbulb, text: "Everyone suggests ideas and votes for or against." },
      { icon: ListChecks, text: "The recap keeps the ideas the group agrees on." },
    ],
  },
} satisfies Meta<typeof IconList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
