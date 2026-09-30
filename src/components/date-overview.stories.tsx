import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { DateOverview } from "./date-overview";

const meta = {
  title: "Components/DateOverview",
  component: DateOverview,
  args: {
    periods: [
      { start: "2027-06-10", end: "2027-06-14" },
      { start: "2027-06-12", end: "2027-06-16" },
      { start: "2027-06-11", end: "2027-06-15" },
    ],
    best: { start: "2027-06-12", end: "2027-06-14" },
    locale: "en",
    labels: {
      view: "Period view",
      timeline: "Timeline",
      calendar: "Calendar",
      period: "A period kept",
      overlap: "Overlap",
      best: "Slot shown",
      days: "Days covered by the periods kept",
    },
  },
} satisfies Meta<typeof DateOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Common: Story = {};
export const OverTwoMonths: Story = {
  args: {
    periods: [
      { start: "2027-06-26", end: "2027-07-03" },
      { start: "2027-06-30", end: "2027-07-05" },
    ],
    best: { start: "2027-06-30", end: "2027-07-03" },
  },
};
