import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ViewSwitch } from "./view-switch";

const meta = {
  title: "Components/ViewSwitch",
  component: ViewSwitch,
  // Hidden on phones by design.
  parameters: { viewport: { defaultViewport: "responsive" } },
  args: { value: "list", onChange: fn(), labels: { label: "Display", list: "List", board: "Board" } },
} satisfies Meta<typeof ViewSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const Board: Story = { args: { value: "board" } };
export const TopicByTopic: Story = { args: { value: "board", labels: { label: "Display", list: "List", board: "Topic by topic" } } };
