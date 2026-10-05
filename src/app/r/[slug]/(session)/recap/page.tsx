import { Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ExportMenu, RecapHostControls } from "@/components/phases/recap-controls";
import { RecapRoundSpotlight, RecapRoundView } from "@/components/phases/recap-round";
import { ViewChoice, ViewChoiceSwitch, ViewProvider } from "@/components/phases/view-choice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecap, hostName, loadPhasePage } from "@/lib/room";
import { cn } from "@/lib/utils";
import { parseViewPreference, VIEW_COOKIE } from "@/lib/view-preference";

export default async function RecapPage({ params }: PageProps<"/r/[slug]/recap">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["RECAP", "CLOSED"]);
  if (!page) return null;

  const t = await getTranslations("recap");
  const { room, me } = page;
  const rounds = await getRecap(room, me.id);
  const current = rounds[rounds.length - 1];
  const closed = room.phase === "CLOSED";
  // One round: its recap; several: a tab each, the current one open.
  const byRound = (render: (round: (typeof rounds)[number]) => React.ReactNode) =>
    rounds.length === 1 ? (
      render(current)
    ) : (
      <Tabs defaultValue={String(current.round)}>
        <TabsList className="mb-4">
          {rounds.map((r) => (
            <TabsTrigger key={r.round} value={String(r.round)}>
              {t("roundTab", { round: r.round })}
            </TabsTrigger>
          ))}
        </TabsList>
        {rounds.map((r) => (
          <TabsContent key={r.round} value={String(r.round)} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            {render(r)}
          </TabsContent>
        ))}
      </Tabs>
    );

  return (
    <PhaseTransition>
      <ViewProvider initialView={parseViewPreference((await cookies()).get(VIEW_COOKIE)?.value)}>
        <PageHeader
          title={closed ? t("closedTitle") : t("title")}
          subtitle={t("summary", { qualified: current.qualifiedCount, total: current.ideaCount })}
          actions={
            <>
              {closed && (
                // Session over: back to the home page to create another one.
                <Button nativeButton={false} render={<Link href="/" />} className="print:hidden">
                  <Plus data-icon="inline-start" />
                  {t("newSession")}
                </Button>
              )}
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
              list={byRound((round) => <RecapRoundView round={round} />)}
              board={
                <>
                  <div className="print:hidden">{byRound((round) => <RecapRoundSpotlight round={round} />)}</div>
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
