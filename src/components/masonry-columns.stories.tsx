import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MasonryColumns } from "./masonry-columns";

const HEIGHTS = [220, 120, 160, 300, 90];

const meta = {
  title: "Components/MasonryColumns",
  component: MasonryColumns,
  args: {
    children: HEIGHTS.map((height, i) => (
      <div key={i} className="grid place-items-center rounded-xl border bg-card font-heading font-bold" style={{ height }}>
        {i + 1}
      </div>
    )),
  },
} satisfies Meta<typeof MasonryColumns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Single: Story = { args: { children: <div className="h-40 rounded-xl border bg-card" /> } };
