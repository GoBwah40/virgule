import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Countdown } from "./countdown";

const inSeconds = (s: number) => new Date(Date.now() + s * 1000).toISOString();

const meta = {
  title: "Composants/Countdown",
  component: Countdown,
  args: {
    endsAt: inSeconds(4 * 60 + 5),
    labels: { running: "Temps restant pour les idées", expired: "Temps écoulé" },
  },
} satisfies Meta<typeof Countdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnCours: Story = {};
export const DerniereMinute: Story = { args: { endsAt: inSeconds(42) } };
export const Ecoule: Story = { args: { endsAt: inSeconds(-5) } };
