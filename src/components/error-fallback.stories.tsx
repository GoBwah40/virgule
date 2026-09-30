import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ErrorFallback } from "./error-fallback";

const meta = {
  title: "Components/ErrorFallback",
  component: ErrorFallback,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Something went wrong",
    body: "The page couldn't be displayed. Try again: most of the time, that's enough.",
    labels: { retry: "Try again", home: "Back to home" },
    onRetry: fn(),
    details: "Error code: 3187542011",
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullPage: Story = {};
export const InSession: Story = {
  args: {
    size: "section",
    title: "This step couldn't be displayed",
    body: "Ideas already suggested and votes already cast are saved. Try again in a moment.",
  },
};
