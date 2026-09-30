import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Crown, UserMinus } from "lucide-react";
import { fn } from "storybook/test";

import { SeatRow } from "./seat-row";

const labels = { row: "4 participants sur 6", free: "Place libre", you: "toi", host: "anime la séance" };

const meta = {
  title: "Composants/SeatRow",
  component: SeatRow,
  args: {
    capacity: 6,
    labels,
    seats: [
      { id: "1", name: "Camille", isHost: true },
      { id: "2", name: "Sacha", isMe: true },
      { id: "3", name: "Inès" },
      { id: "4", name: "Noah" },
    ],
  },
} satisfies Meta<typeof SeatRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complet: Story = {
  args: {
    seats: ["Camille", "Sacha", "Inès", "Noah", "Lou", "Eden"].map((name, i) => ({ id: String(i), name, isHost: i === 0 })),
  },
};

export const PlacesCliquables: Story = {
  args: { onFreeSeatClick: fn(), labels: { ...labels, free: "Place libre : touche pour copier le lien d'invitation" } },
};

export const Grand: Story = { args: { size: "md" } };

export const MenuDesPlaces: Story = {
  args: {
    menu: {
      label: (seat) => `Place de ${seat.name} : options`,
      actions: (seat) =>
        seat.isMe
          ? []
          : [
              { id: "host", label: "Confier l'animation", icon: Crown },
              { id: "remove", label: "Retirer de la séance", icon: UserMinus, destructive: true },
            ],
      onSelect: fn(),
    },
  },
};
