import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MapLink } from "./map-link";

const meta = {
  title: "Components/MapLink",
  component: MapLink,
  args: { query: "Three Oaks Cottage, Vercors", label: "View on the map" },
} satisfies Meta<typeof MapLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Place: Story = {};
