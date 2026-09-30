import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { PhaseTransition } from "@/components/phase-transition";
import { ExportMenu, RecapHostControls } from "@/components/phases/recap-controls";
import { RecapRoundView } from "@/components/phases/recap-round";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecap, hostName, loadPhasePage } from "@/lib/room";
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
    <PhaseTransition>
      <PageHeader
        title={closed ? t("closedTitle") : t("title")}
        subtitle={t("summary", { qualified: current.qualifiedCount, total: current.ideaCount })}
        actions={
          <>
            {closed && (
              // Séance terminée : retour à l'accueil pour en créer une autre.
              <Button nativeButton={false} render={<Link href="/" />} className="print:hidden">
                <Plus data-icon="inline-start" />
                {t("newSession")}
              </Button>
            )}
            <ExportMenu slug={slug} />
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
                <TabsContent
                  key={r.round}
                  value={String(r.round)}
                  className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"
                >
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
                tiedThemeCount={current.tiedThemeCount}
              />
            ) : (
              <p className="text-muted-foreground">{t("waitingHost", { host: hostName(page.participants) })}</p>
            )}
          </aside>
        )}
      </div>
    </PhaseTransition>
  );
}
