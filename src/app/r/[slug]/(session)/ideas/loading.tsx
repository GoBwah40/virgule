import { getTranslations } from "next-intl/server";

import { CardSkeleton } from "@/components/card-skeleton";
import { MasonryColumns } from "@/components/masonry-columns";
import { LoadingState } from "@/components/loading-state";
import { PageHeaderSkeleton } from "@/components/page-header-skeleton";

/** Loading of the "Ideas" step: topic cards with vote rows and an input field. */
export default async function IdeasLoading() {
  const t = await getTranslations("loading");
  return (
    <LoadingState label={t("ideas")}>
      <PageHeaderSkeleton />
      <MasonryColumns>
        <CardSkeleton rows={2} rowActions="votes" withComposer />
        <CardSkeleton rows={1} rowActions="votes" withComposer />
      </MasonryColumns>
    </LoadingState>
  );
}
