import { getTranslations } from "next-intl/server";

import { CardSkeleton } from "@/components/card-skeleton";
import { ListItemSkeleton } from "@/components/list-item-skeleton";
import { LoadingState } from "@/components/loading-state";
import { PageHeaderSkeleton } from "@/components/page-header-skeleton";

/** Chargement de l'étape « Sujets » : même mise en page que la page de l'animateur. */
export default async function ThemesLoading() {
  const t = await getTranslations("loading");
  return (
    <LoadingState label={t("themes")}>
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-2">
          <ListItemSkeleton width="long" />
          <ListItemSkeleton width="medium" />
          <ListItemSkeleton width="short" />
        </ul>
        <CardSkeleton rows={0} />
      </div>
    </LoadingState>
  );
}
