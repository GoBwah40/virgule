import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Crown, UserMinus } from "lucide-react";
import { fn } from "storybook/test";

import { SeatRow } from "./seat-row";

const labels = { row: "4 participants out of 6", free: "Free seat", you: "you", host: "is hosting" };

const meta = {
  title: "Components/SeatRow",
  component: SeatRow,
  args: {
    capacity: 6,
    labels,
    seats: [
      { id: "1", name: "Camille", isHost: true },
      { id: "2", name: "Sasha", isMe: true },
      { id: "3", name: "Ines" },
      { id: "4", name: "Noah" },
    ],
  },
} satisfies Meta<typeof SeatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Full: Story = {
  args: {
    seats: ["Camille", "Sasha", "Ines", "Noah", "Lou", "Eden"].map((name, i) => ({ id: String(i), name, isHost: i === 0 })),
  },
};

export const ClickableSeats: Story = {
  args: { onFreeSeatClick: fn(), labels: { ...labels, free: "Free seat: tap to copy the invite link" } },
};

export const Large: Story = { args: { size: "md" } };

export const SeatMenu: Story = {
  args: {
    menu: {
      label: (seat) => `${seat.name}'s seat: options`,
      actions: (seat) =>
        seat.isMe
          ? []
          : [
              { id: "host", label: "Hand over hosting", icon: Crown },
              { id: "remove", label: "Remove from the session", icon: UserMinus, destructive: true },
            ],
      onSelect: fn(),
    },
  },
};
