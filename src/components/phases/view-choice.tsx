"use client";

import { useTranslations } from "next-intl";
import { createContext, use } from "react";

import { ViewSwitch } from "@/components/view-switch";
import { useViewPreference } from "@/hooks/use-view-preference";
import type { ViewPreference } from "@/lib/view-preference";

const ViewContext = createContext<ReturnType<typeof useViewPreference> | null>(null);

/**
 * The layout picked by this person, shared by a step's page: the switch sits in the page header,
 * next to the host's buttons, and the content below follows it.
 */
export function ViewProvider({ initialView, children }: { initialView: ViewPreference; children: React.ReactNode }) {
  return <ViewContext value={useViewPreference(initialView)}>{children}</ViewContext>;
}

export function useView() {
  const state = use(ViewContext);
  if (!state) throw new Error("useView must be used within a ViewProvider");
  return state;
}

/** List or board, from tablets up (`boardLabel` names the board, "Topic by topic" in the recap). */
export function ViewChoiceSwitch({ boardLabel = "board" }: { boardLabel?: "board" | "oneByOne" }) {
  const t = useTranslations("view");
  const [view, choose] = useView();
  // Pushed to the right of the header actions, apart from the step's buttons.
  return <ViewSwitch className="ml-auto" value={view} onChange={choose} labels={{ label: t("label"), list: t("list"), board: t(boardLabel) }} />;
}

/** A step rendered both ways by the server, shown as each person picked. */
export function ViewChoice({ list, board }: { list: React.ReactNode; board: React.ReactNode }) {
  const [view] = useView();
  return view === "board" ? board : list;
}
