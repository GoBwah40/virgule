import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BoardColumns } from "./board-columns";

const block = (title: string, lines: number) => (
  <div key={title} className="rounded-xl border bg-card p-4">
    <p className="font-heading font-bold">{title}</p>
    {Array.from({ length: lines }, (_, i) => (
      <p key={i} className="text-sm text-muted-foreground">
        Idea {i + 1}
      </p>
    ))}
  </div>
);

const meta = {
  title: "Components/BoardColumns",
  component: BoardColumns,
  parameters: { viewport: { defaultViewport: "responsive" } },
  args: { children: [block("Dates", 3), block("Place", 1), block("Budget", 5)] },
} satisfies Meta<typeof BoardColumns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeTopics: Story = {};
export const SixTopics: Story = {
  args: { children: ["Fats", "Fruit", "Meat", "Starch", "Cereal", "Dairy"].map((title, i) => block(title, i % 3)) },
};
