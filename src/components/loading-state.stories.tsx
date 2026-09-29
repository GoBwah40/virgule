import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CardSkeleton } from "./card-skeleton";
import { LoadingState } from "./loading-state";
import { PageHeaderSkeleton } from "./page-header-skeleton";

/** Composition d'un écran de chargement complet, comme app/r/[slug]/ideas/loading.tsx. */
const meta = {
  title: "Chargement/LoadingState",
  component: LoadingState,
  args: {
    label: "Chargement des idées…",
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

export const PageDesIdees: Story = {};
