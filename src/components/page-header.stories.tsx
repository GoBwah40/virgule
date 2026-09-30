import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "./page-header";
import { Button } from "./ui/button";

const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  args: { title: "The ideas", subtitle: "Suggest your ideas and vote on everyone else's." },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button>See the recap</Button>
        <Button variant="outline">Edit the topics</Button>
      </>
    ),
  },
};
