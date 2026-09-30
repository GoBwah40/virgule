import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Clock, SearchX } from "lucide-react";

import { StatusPage } from "./status-page";
import { Button } from "./ui/button";

const meta = {
  title: "Components/StatusPage",
  component: StatusPage,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Session not found",
    body: "The link may be incomplete. Ask the person hosting the session to send it again.",
    children: <Button>Back to home</Button>,
  },
} satisfies Meta<typeof StatusPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NotFound: Story = { args: { icon: SearchX } };
export const Expired: Story = {
  args: {
    icon: Clock,
    title: "This session is no longer available",
    body: "Sessions stay online for 7 days. Create a new one to pick up where you left off.",
  },
};
