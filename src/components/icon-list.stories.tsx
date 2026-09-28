import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListChecks, Lightbulb, Tags } from "lucide-react";

import { IconList } from "./icon-list";

const meta = {
  title: "Composants/IconList",
  component: IconList,
  args: {
    items: [
      { icon: Tags, text: "Tu choisis les sujets : objectif, dates, budget…" },
      { icon: Lightbulb, text: "Chacun propose ses idées et vote pour ou contre." },
      { icon: ListChecks, text: "Le bilan garde ce qui fait envie." },
    ],
  },
} satisfies Meta<typeof IconList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
