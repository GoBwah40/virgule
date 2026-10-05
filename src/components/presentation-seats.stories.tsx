import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationSeats } from "./presentation-seats";

const meta = {
  title: "Components/PresentationSeats",
  component: PresentationSeats,
  // The room screen is always dark.
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  args: {
    capacity: 6,
    label: "4 seats out of 6 taken",
    seats: [
      { id: "1", name: "Camille" },
      { id: "2", name: "Sasha" },
      { id: "3", name: "Ines" },
      { id: "4", name: "Noah" },
    ],
  },
} satisfies Meta<typeof PresentationSeats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HostAlone: Story = { args: { label: "1 seat out of 6 taken", seats: [{ id: "1", name: "Camille" }] } };
export const Full: Story = {
  args: {
    label: "All seats are taken",
    seats: ["Camille", "Sasha", "Ines", "Noah", "Leo", "Mia"].map((name, i) => ({ id: String(i), name })),
  },
};
export const TwelveSeats: Story = {
  args: { capacity: 12, label: "5 seats out of 12 taken", seats: ["Camille", "Sasha", "Ines", "Noah", "Leo"].map((name, i) => ({ id: String(i), name })) },
};
