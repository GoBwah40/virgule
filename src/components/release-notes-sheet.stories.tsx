import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReleaseNotesSheet } from "./release-notes-sheet";

const meta = {
  title: "Composants/ReleaseNotesSheet",
  component: ReleaseNotesSheet,
  args: {
    version: "0.4.0",
    onOpenChange: fn(),
    labels: {
      trigger: "Nouveautés",
      unread: "Nouvelle version",
      title: "Nouveautés",
      description: "Ce qui a changé dans Virgule, version par version.",
      close: "Fermer",
      latest: "Dernière",
      categories: { added: "Ajouts", improved: "Améliorations", fixed: "Corrections" },
    },
    releases: [
      {
        version: "0.4.0",
        date: "30 septembre 2026",
        changes: {
          added: ["Tour de départage des ex æquo", "Minuteur pendant les idées"],
          improved: ["Nouvelle page d'accueil"],
          fixed: [],
        },
      },
      {
        version: "0.3.0",
        date: "30 septembre 2026",
        changes: { added: ["Sujets typés"], improved: [], fixed: ["Votes lisibles en mode sombre"] },
      },
    ],
  },
} satisfies Meta<typeof ReleaseNotesSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DejaVue: Story = {};
export const NouvelleVersion: Story = { args: { unread: true } };
