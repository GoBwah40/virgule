import { getTranslations } from "next-intl/server";

import { CardSkeleton } from "@/components/card-skeleton";
import { LoadingState } from "@/components/loading-state";
import { PageHeaderSkeleton } from "@/components/page-header-skeleton";

/** Loading of the "Ideas" step: topic cards with vote rows and an input field. */
export default async function IdeasLoading() {
  const t = await getTranslations("loading");
  return (
    <LoadingState label={t("ideas")}>
      <PageHeaderSkeleton />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <CardSkeleton rows={2} rowActions="votes" withComposer />
        <CardSkeleton rows={1} rowActions="votes" withComposer />
      </div>
    </LoadingState>
  );
}
