import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PresentationJoin } from "./presentation-join";
import { PresentationLobby } from "./presentation-lobby";

const meta = {
  title: "Components/PresentationLobby",
  component: PresentationLobby,
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
    title: "Team retreat, spring",
    note: "Sam is preparing the topics. Scan the code to join.",
    join: <PresentationJoin path="/r/abc123" label="Scan to join" qrLabel="QR code for the invite link" />,
  },
} satisfies Meta<typeof PresentationLobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Full: Story = { args: { join: null, note: "Sam is preparing the topics." } };
export const LongName: Story = { args: { title: "W".repeat(80) } };
