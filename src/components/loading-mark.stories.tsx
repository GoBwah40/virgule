import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./ui/button";
import { LoadingMark } from "./loading-mark";

const meta = {
  title: "Loading/LoadingMark",
  component: LoadingMark,
  args: { className: "text-5xl" },
} satisfies Meta<typeof LoadingMark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In the brand colors. */
export const Brand: Story = {};
/** In the text color, as inside a button. */
export const Current: Story = { args: { tone: "current", className: "text-5xl text-muted-foreground" } };
/** A button whose action is running: same size, the mark replaces the label. */
export const InButton: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" pending>
        Start the ideas
      </Button>
      <Button variant="outline" pending>
        Back to topics
      </Button>
      <Button variant="destructive" pending>
        End the session
      </Button>
    </div>
  ),
};
