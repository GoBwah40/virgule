import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { FeedbackDialog } from "./feedback-dialog";

const meta = {
  title: "Components/FeedbackDialog",
  component: FeedbackDialog,
  args: {
    maxLength: { title: 100, description: 2000 },
    labels: {
      trigger: "Feedback",
      title: "An idea or a bug?",
      description:
        "Your message goes to the team as a public issue on GitHub: anyone can read it, so leave out names and personal details.",
      kind: "Type",
      idea: "Idea",
      bug: "Bug",
      titleField: "In a few words",
      descriptionField: "Details",
      details: "Attach technical details",
      detailsHint: "Version, browser, language and the page you're on, without the session link. Helps a lot with a bug.",
      submit: "Send",
      close: "Close",
    },
    onSubmit: fn(),
  },
} satisfies Meta<typeof FeedbackDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sending: Story = { args: { pending: true } };
