import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationScreen } from "./presentation-screen";

const meta = {
  title: "Components/PresentationScreen",
  component: PresentationScreen,
  parameters: { layout: "fullscreen", viewport: { defaultViewport: "responsive" } },
  args: {
    appName: "Virgule",
    title: "Team retreat, spring",
    stepsLabel: "Session steps",
    steps: [
      { id: "THEMES", label: "Topics" },
      { id: "IDEAS", label: "Ideas" },
      { id: "RECAP", label: "Recap" },
    ],
    current: 1,
    fullscreenHint: "Click or press a key to go full screen",
    footer: <p className="stage-sm text-muted-foreground">3 people out of 6 have voted</p>,
    children: <p className="m-auto font-heading stage-xl font-extrabold">Content of the step</p>,
  },
} satisfies Meta<typeof PresentationScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleInContent: Story = { args: { showTitle: false, current: 0 } };
export const AllDone: Story = { args: { current: 3, footer: undefined } };
