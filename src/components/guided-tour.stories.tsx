import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { GuidedTour } from "./guided-tour";

const meta = {
  title: "Components/GuidedTour",
  component: GuidedTour,
  decorators: [
    (Story) => (
      <div className="max-w-sm space-y-4">
        <Card data-tour="topic">
          <CardContent>Add a topic</CardContent>
        </Card>
        <Button data-tour="start" className="w-full">
          Move on to ideas
        </Button>
        <Story />
      </div>
    ),
  ],
  args: {
    // A new key on each load: the offer shows every time in the catalog.
    storageKey: `virgule:tour:story:${Date.now()}`,
    steps: [
      { target: "topic", title: "Add your topics", body: "Each topic is a question for the group." },
      { target: "start", title: "Move on to ideas", body: "Everyone follows you to the next step automatically." },
    ],
    labels: {
      offerTitle: "First time hosting?",
      offerBody: "Take a quick tour of this page, in under a minute.",
      start: "Take the tour",
      dismiss: "Not now",
      next: "Next",
      back: "Back",
      done: "Got it",
      quit: "Leave the tour",
      progress: (current, total) => `Step ${current} of ${total}`,
      replay: "Take the tour of this page",
    },
  },
} satisfies Meta<typeof GuidedTour>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First visit: the offer shows; accepted, the tour rings each element in turn. */
export const FirstVisit: Story = {};

/** Already answered on this device: only the button to take the tour again. */
export const AlreadySeen: Story = {
  args: { storageKey: "virgule:tour:story:seen" },
  beforeEach: () => localStorage.setItem("virgule:tour:story:seen", "1"),
};
