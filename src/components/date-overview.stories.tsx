import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DateOverview } from "./date-overview";

const meta = {
  title: "Composants/DateOverview",
  component: DateOverview,
  args: {
    periods: [
      { start: "2027-06-10", end: "2027-06-14" },
      { start: "2027-06-12", end: "2027-06-16" },
      { start: "2027-06-11", end: "2027-06-15" },
    ],
    best: { start: "2027-06-12", end: "2027-06-14" },
    locale: "fr",
    labels: {
      view: "Affichage des périodes",
      timeline: "Frise",
      calendar: "Calendrier",
      period: "Une période retenue",
      overlap: "Recoupement",
      best: "Créneau affiché",
      days: "Jours couverts par les périodes retenues",
    },
  },
} satisfies Meta<typeof DateOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Commun: Story = {};
export const SurDeuxMois: Story = {
  args: {
    periods: [
      { start: "2027-06-26", end: "2027-07-03" },
      { start: "2027-06-30", end: "2027-07-05" },
    ],
    best: { start: "2027-06-30", end: "2027-07-03" },
  },
};
