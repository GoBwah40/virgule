import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CardSkeleton } from "./card-skeleton";
import { LoadingState } from "./loading-state";
import { PageHeaderSkeleton } from "./page-header-skeleton";

/** A full loading screen composition, like app/r/[slug]/(session)/ideas/loading.tsx. */
const meta = {
  title: "Loading/LoadingState",
  component: LoadingState,
  args: {
    label: "Loading ideas…",
    children: (
      <>
        <PageHeaderSkeleton />
        <div className="grid items-start gap-6 md:grid-cols-2">
          <CardSkeleton rows={2} rowActions="votes" withComposer />
          <CardSkeleton rows={1} rowActions="votes" withComposer />
        </div>
      </>
    ),
  },
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IdeasPage: Story = {};
