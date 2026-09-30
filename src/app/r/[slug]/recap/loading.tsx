import { getTranslations } from "next-intl/server";

import { CardSkeleton } from "@/components/card-skeleton";
import { LoadingState } from "@/components/loading-state";
import { PageHeaderSkeleton } from "@/components/page-header-skeleton";

/** Loading of the recap: result cards with their status. */
export default async function RecapLoading() {
  const t = await getTranslations("loading");
  return (
    <LoadingState label={t("recap")}>
      <PageHeaderSkeleton actions={1} />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <CardSkeleton rows={3} rowActions="status" />
          <CardSkeleton rows={2} rowActions="status" />
        </div>
      </div>
    </LoadingState>
  );
}
