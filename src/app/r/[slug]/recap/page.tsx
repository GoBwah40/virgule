import { getTranslations } from "next-intl/server";

import { PhaseTitle } from "@/components/phases/phase-title";
import { ExportMenu, RecapHostControls } from "@/components/phases/recap-controls";
import { RecapRoundView } from "@/components/phases/recap-round";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecap, loadPhasePage } from "@/lib/room";
import { cn } from "@/lib/utils";

export default async function RecapPage({ params }: PageProps<"/r/[slug]/recap">) {
  const { slug } = await params;
  const page = await loadPhasePage(slug, ["RECAP", "CLOSED"]);
  if (!page) return null;

  const t = await getTranslations("recap");
  const { room, me } = page;
  const rounds = await getRecap(room, me.id);
  const current = rounds[rounds.length - 1];
  const closed = room.phase === "CLOSED";

  return (
    <>
      <PhaseTitle
        title={closed ? t("closedTitle") : t("title")}
        subtitle={t("summary", { qualified: current.qualifiedCount, total: current.ideaCount })}
        actions={<ExportMenu slug={slug} />}
      />

      {closed && (
        <Alert className="mb-6">
          <AlertDescription>{t("closedBody")}</AlertDescription>
        </Alert>
      )}

      <div className={cn("grid gap-6", !closed && "lg:grid-cols-[1fr_300px]")}>
        <div className="min-w-0">
          {rounds.length === 1 ? (
            <RecapRoundView round={current} />
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
                <TabsContent key={r.round} value={String(r.round)}>
                  <RecapRoundView round={r} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {!closed && (
          <aside>
            {me.isHost ? (
              <RecapHostControls
                slug={slug}
                requireNetPositive={room.requireNetPositive}
                nextRound={room.round + 1}
                qualifiedCount={current.qualifiedCount}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("waitingHost")}</p>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
