import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OverviewSummary } from "./overview-summary";

const meta = {
  title: "Composants/OverviewSummary",
  component: OverviewSummary,
  args: { summary: "Créneau commun : du 12 au 14 juin 2027", detail: "Commun aux 3 périodes retenues.", common: true },
} satisfies Meta<typeof OverviewSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Commun: Story = {};
export const Partiel: Story = {
  args: { summary: "Créneau le plus partagé : du 13 au 14 juin 2027", detail: "Commun à 2 périodes retenues sur 3.", common: false },
};
