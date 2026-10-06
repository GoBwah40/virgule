import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ExportMenu, RecapHostControls, ReuseTopicsButton, ShareRecapButton } from "@/components/phases/recap-controls";
import { RecapByRound, RecapRoundSpotlight, RecapRoundView } from "@/components/phases/recap-round";
import { ViewChoice, ViewChoiceSwitch, ViewProvider } from "@/components/phases/view-choice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getRecap, getRecapComments, getSharePath, hostName, loadPhasePage } from "@/lib/room";
import { cn } from "@/lib/utils";
import { parseViewPreference, VIEW_COOKIE } from "@/lib/view-preference";

export default async function RecapPage({ params }: PageProps<"/r/[slug]/recap">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["RECAP", "CLOSED"]);
  if (!page) return null;

  const t = await getTranslations("recap");
  const { room, me } = page;
  const [rounds, comments] = await Promise.all([getRecap(room, me.id), getRecapComments(room, me.id)]);
  const current = rounds[rounds.length - 1];
  const closed = room.phase === "CLOSED";
  const byRound = (render: (round: (typeof rounds)[number]) => React.ReactNode) => <RecapByRound rounds={rounds} render={render} />;
  const sharePath = await getSharePath(room.id, me);
  // The latest round only: an earlier one may have settled on something since changed.
  const calendarHref = (round: (typeof rounds)[number]) =>
    round.round === current.round ? (themeId: string) => `/r/${slug}/calendar?theme=${themeId}` : undefined;

  return (
    <PhaseTransition>
      <ViewProvider initialView={parseViewPreference((await cookies()).get(VIEW_COOKIE)?.value)}>
        <PageHeader
          title={closed ? t("closedTitle") : t("title")}
          subtitle={t("summary", { qualified: current.qualifiedCount, total: current.ideaCount })}
          actions={
            <>
              {closed && (
                // Session over: back to the home page to create another one, or the same topics again.
                <>
                  <Button nativeButton={false} render={<Link href="/" />} className="print:hidden">
                    <Plus data-icon="inline-start" />
                    {t("newSession")}
                  </Button>
                  <ReuseTopicsButton slug={slug} />
                </>
              )}
              {me.isHost && <ShareRecapButton slug={slug} sharePath={sharePath} roomName={room.name} />}
              <ExportMenu slug={slug} />
              <ViewChoiceSwitch boardLabel="oneByOne" />
            </>
          }
        />

        {closed && (
          <Alert className="mb-6">
            <AlertDescription>{t("closedBody")}</AlertDescription>
          </Alert>
        )}

        <div className={cn("grid gap-6", !closed && "lg:grid-cols-[1fr_300px]")}>
          <div className="min-w-0">
            {/* Printed, always the full list: "topic by topic" would print a single topic. */}
            <ViewChoice
              list={byRound((round) => <RecapRoundView round={round} calendarHref={calendarHref(round)} comments={comments} />)}
              board={
                <>
                  <div className="print:hidden">
                    {byRound((round) => <RecapRoundSpotlight round={round} calendarHref={calendarHref(round)} />)}
                  </div>
                  <div className="hidden print:block">{byRound((round) => <RecapRoundView round={round} />)}</div>
                </>
              }
            />
          </div>

          {!closed && (
            <aside>
              {me.isHost ? (
                <RecapHostControls
                  slug={slug}
                  requireNetPositive={room.requireNetPositive}
                  nextRound={room.round + 1}
                  qualifiedCount={current.qualifiedCount}
                  tiedThemeCount={current.tiedThemeCount}
                  hasPointsTopics={current.themes.some((theme) => theme.pointsBudget !== null)}
                />
              ) : (
                <p className="text-muted-foreground">{t("waitingHost", { host: hostName(page.participants) })}</p>
              )}
            </aside>
          )}
        </div>
      </ViewProvider>
    </PhaseTransition>
  );
}
