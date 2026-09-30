import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReleaseNotesSheet } from "./release-notes-sheet";

const meta = {
  title: "Components/ReleaseNotesSheet",
  component: ReleaseNotesSheet,
  args: {
    version: "0.4.0",
    onOpenChange: fn(),
    labels: {
      trigger: "What's new",
      unread: "New version",
      title: "What's new",
      description: "What changed in Virgule, version by version.",
      close: "Close",
      latest: "Latest",
      categories: { added: "Added", improved: "Improved", fixed: "Fixed" },
    },
    releases: [
      {
        version: "0.4.0",
        date: "September 30, 2026",
        changes: {
          added: ["Tiebreak round for tied ideas", "Timer during the ideas"],
          improved: ["New home page"],
          fixed: [],
        },
      },
      {
        version: "0.3.0",
        date: "September 30, 2026",
        changes: { added: ["Typed topics"], improved: [], fixed: ["Votes readable in dark mode"] },
      },
    ],
  },
} satisfies Meta<typeof ReleaseNotesSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seen: Story = {};
export const NewVersion: Story = { args: { unread: true } };
