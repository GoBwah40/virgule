"use client";

import { useTranslations } from "next-intl";

import { ViewSwitch } from "@/components/view-switch";
import { useViewPreference } from "@/hooks/use-view-preference";
import type { ViewPreference } from "@/lib/view-preference";

/**
 * A step rendered both ways by the server, shown as each person picked: the list, or the board
 * (`boardLabel` names it, "Topic by topic" in the recap). The switch sits above, from tablets up.
 */
export function ViewChoice({
  initialView,
  list,
  board,
  boardLabel = "board",
}: {
  initialView: ViewPreference;
  list: React.ReactNode;
  board: React.ReactNode;
  boardLabel?: "board" | "oneByOne";
}) {
  const t = useTranslations("view");
  const [view, choose] = useViewPreference(initialView);
  return (
    <>
      <ViewSwitch className="mb-4" value={view} onChange={choose} labels={{ label: t("label"), list: t("list"), board: t(boardLabel) }} />
      {view === "board" ? board : list}
    </>
  );
}
