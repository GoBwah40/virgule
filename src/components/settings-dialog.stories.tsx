import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SegmentedControl } from "./segmented-control";
import { SettingsDialog } from "./settings-dialog";
import { SettingSwitch } from "./setting-switch";

const meta = {
  title: "Components/SettingsDialog",
  component: SettingsDialog,
  args: {
    labels: { trigger: "Open the settings", title: "Settings", close: "Close" },
    children: (
      <>
        <SettingSwitch id="story-self-vote" label="Vote on your own ideas" hint="When off, nobody can vote on the ideas they suggested." checked onCheckedChange={() => {}} />
        <SettingSwitch id="story-comments" label="Comments on ideas" checked={false} onCheckedChange={() => {}} />
        <SegmentedControl
          name="story-timer"
          label="Ideas timer"
          options={[
            { value: "off", label: "None" },
            { value: "5", label: "5 min" },
            { value: "10", label: "10 min" },
          ]}
          value="off"
          onChange={() => {}}
        />
      </>
    ),
  },
} satisfies Meta<typeof SettingsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};
export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open the settings" }));
  },
};
