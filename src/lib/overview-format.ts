import "server-only";

import { getTranslations } from "next-intl/server";

import { getIdeaFormat } from "@/lib/idea-format";
import type { RecapOverview } from "@/lib/room";

export type OverviewText = { summary: string; detail: string; common: boolean };

/**
 * Texts of a topic overview in the recap, shared by the page and the exports
 * (French output: « Créneau commun : du 12 au 14 juin 2027 » / « Commun aux 3 périodes retenues. »).
 */
export async function getOverviewText(): Promise<(overview: RecapOverview) => OverviewText> {
  const t = await getTranslations("recap");
  const format = await getIdeaFormat();

  return (overview) => {
    const { best } = overview;
    const common = best.count === best.total;
    const counts = { count: best.count, total: best.total };
    if (overview.type === "dates") {
      return {
        common,
        summary: t(common ? "dateCommon" : "dateBest", { range: format.dateSpan(overview.best.start, overview.best.end) }),
        detail: t(common ? "dateCommonDetail" : "dateBestDetail", counts),
      };
    }
    return {
      common,
      summary: t(common ? "amountCommon" : "amountBest", { range: format.amountSpan(overview.best.start, overview.best.end) }),
      detail: t(common ? "amountCommonDetail" : "amountBestDetail", counts),
    };
  };
}
