import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationCarousel } from "./presentation-carousel";

const slide = (text: string) => <p className="font-heading stage-xl font-extrabold">{text}</p>;

const meta = {
  title: "Components/PresentationCarousel",
  component: PresentationCarousel,
  parameters: { viewport: { defaultViewport: "responsive" } },
  // The room screen is always dark.
  decorators: [
    (Story) => (
      <div data-theme="dark" className="bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Results by topic",
    slides: [slide("Annecy"), slide("June 4 – 5"), slide("From €150 to €250")],
    positions: ["Topic 1 of 3", "Topic 2 of 3", "Topic 3 of 3"],
    intervalMs: 4000,
  },
} satisfies Meta<typeof PresentationCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rotating: Story = {};
export const Single: Story = { args: { slides: [slide("Annecy")], positions: ["Topic 1 of 1"] } };
